import {
	type EnumDeclaration,
	type InterfaceDeclaration,
	Node,
	Project,
	type Type,
	type TypeAliasDeclaration,
} from "ts-morph";

interface SwiftType {
	type: string;
	defaultValue: string;
}

function getTypeName(type: Type): string {
	return type.getSymbol()?.getName() || type.getText();
}

/**
 * Parse TypeScript code once and extract all interface and enum declarations
 */
function parseTypeScriptDeclarations(typescriptCode: string): {
	interfaces: InterfaceDeclaration[];
	enums: EnumDeclaration[];
	unionAliases: TypeAliasDeclaration[];
} {
	if (!typescriptCode.trim()) {
		return { interfaces: [], enums: [], unionAliases: [] };
	}

	const project = new Project({
		useInMemoryFileSystem: true,
		compilerOptions: {
			strictNullChecks: true,
		},
	});
	const sourceFile = project.createSourceFile("input.ts", typescriptCode);

	return {
		interfaces: sourceFile.getInterfaces(),
		enums: sourceFile.getEnums(),
		unionAliases: sourceFile.getTypeAliases().filter((alias) => {
			const aliasType = alias.getType();
			if (!aliasType.isUnion()) return false;
			const unionTypes = aliasType.getUnionTypes();
			const literalMembers = unionTypes.filter(
				(t) => t.isStringLiteral() || t.isNumberLiteral(),
			);
			// Must be a union of only string/number literals (excluding null/undefined)
			const nonNullish = unionTypes.filter(
				(t) => !t.isUndefined() && !t.isNull(),
			);
			return (
				nonNullish.length > 0 && nonNullish.length === literalMembers.length
			);
		}),
	};
}

function isUint8Array(propertyType: Type): boolean {
	return getTypeName(propertyType) === "Uint8Array";
}

function isOptionalUnion(propertyType: Type): boolean {
	return (
		propertyType.isUnion() &&
		propertyType
			.getUnionTypes()
			.some((type) => type.isUndefined() || type.isNull())
	);
}

// Deduplicate types by the swift type name.
function dedupeTypes(types: SwiftType[]): SwiftType[] {
	const uniqueTypes = types.reduce(
		(acc, swiftType) => {
			acc[swiftType.type] = swiftType;
			return acc;
		},
		{} as Record<string, SwiftType>,
	);
	return Object.values(uniqueTypes);
}

/**
 * Convert TypeScript type to Swift type recursively
 */
function mapTypeScriptToSwiftType(propertyType: Type): SwiftType {
	if (propertyType.isString()) {
		return { type: "String", defaultValue: '""' };
	}
	if (propertyType.isNumber()) {
		return { type: "Double", defaultValue: "0.0" };
	}
	if (propertyType.isBoolean() || propertyType.isBooleanLiteral()) {
		return { type: "Bool", defaultValue: "false" };
	}
	// Check if it's actually the 'any' type, not just any type
	if (propertyType.isAny() && getTypeName(propertyType) === "any") {
		return { type: "Any", defaultValue: "[:]" };
	}
	if (isUint8Array(propertyType)) {
		return { type: "Data", defaultValue: "Data()" };
	}

	// Handle array types recursively
	if (propertyType.isArray()) {
		const elementType = propertyType.getArrayElementType();
		if (!elementType) {
			throw new Error(`Array ${getTypeName(propertyType)} has no element type`);
		}
		return {
			type: `[${mapTypeScriptToSwiftType(elementType).type}]`,
			defaultValue: "[]",
		};
	}

	if (isRecordType(propertyType)) {
		const [keyType, valueType] = getRecordTypeArguments(propertyType);
		if (keyType && valueType) {
			const swiftKeyType = mapTypeScriptToSwiftType(keyType);
			const swiftValueType = mapTypeScriptToSwiftType(valueType);
			return {
				type: `[${swiftKeyType.type}: ${swiftValueType.type}]`,
				defaultValue: "[:]",
			};
		}
	}

	if (propertyType.isInterface()) {
		const interfaceName = getTypeName(propertyType);
		return { type: interfaceName, defaultValue: `${interfaceName}()` };
	}

	if (propertyType.isUnion()) {
		// It's a union.
		// These could be enums, nullable unions (T | null | undefined) or named aliases (type Status = "a" | "b")
		const nonNullableType = propertyType.getNonNullableType();
		if (nonNullableType.isEnum()) {
			const enumDecl = nonNullableType
				.getSymbolOrThrow()
				.getDeclarations()
				.find(Node.isEnumDeclaration);
			if (!enumDecl) {
				throw new Error(`Enum ${getTypeName(nonNullableType)} not found`);
			}
			return {
				type: getTypeName(nonNullableType),
				defaultValue: getEnumDefaultValue(enumDecl),
			};
		}

		// filter out any null/undefined types
		const unionTypes = propertyType.getUnionTypes();
		const nonNullishTypes = unionTypes.filter(
			(type) => !type.isUndefined() && !type.isNull(),
		);

		// does this union come from a named alias? (e.g., type Status = "a" | "b")
		const aliasName = nonNullableType.getAliasSymbol()?.getName();
		if (aliasName && nonNullableType.isUnion()) {
			const defaultValue = getUnionAliasDefaultValue(nonNullishTypes);
			return { type: aliasName, defaultValue };
		}

		// It's an inline union.
		// Note: we currently don't support inline literal unions as we would need to auto-generate an enum.
		const swiftTypes = nonNullishTypes.map((type) =>
			mapTypeScriptToSwiftType(type),
		);

		// Deduplicate the resulting types (e.g true | false -> Bool)
		const [swiftType] = dedupeTypes(swiftTypes);
		if (swiftType) {
			return { type: swiftType.type, defaultValue: swiftType.defaultValue };
		}
		throw new Error(`Unsupported union type: ${getTypeName(propertyType)}`);
	}

	throw new Error(`Unsupported TypeScript type: ${getTypeName(propertyType)}`);
}

function isRecordType(type: Type): boolean {
	return type.getAliasSymbol()?.getName() === "Record";
}

function getRecordTypeArguments(type: Type): [Type?, Type?] {
	const aliasTypeArguments = type.getAliasTypeArguments();
	return [aliasTypeArguments[0], aliasTypeArguments[1]];
}

// Get the default value from an enum declaration.
// Currently this is just the first member.
function getEnumDefaultValue(enumDecl: EnumDeclaration): string {
	const members = enumDecl.getMembers();
	const firstMemberName = members[0]?.getName();
	if (!firstMemberName) {
		throw new Error(`Enum ${enumDecl.getName()} has no members`);
	}
	return `.${firstMemberName}`;
}

// Get the default value from a union alias. (e.g. type Status = "a" | "b")
// Currently this is just the first literal.
function getUnionAliasDefaultValue(unionTypes: Type[]): string {
	const first = unionTypes[0];
	if (first?.isStringLiteral()) {
		const literal = String(first.getLiteralValue());
		return `.${literal}`;
	} else if (first?.isNumberLiteral()) {
		const value = String(first.getLiteralValue());
		// Numeric case names in Swift enums are prefixed with underscore
		return `._${value}`;
	} else {
		throw new Error(
			`Unsupported union type: ${first ? getTypeName(first) : "unknown"}`,
		);
	}
}

/**
 * Generate Swift enum code for a single enum declaration
 * TODO: Error handling for heterogeneous enums (mix string and numeric)
 */
function generateSwiftEnum(enumDecl: EnumDeclaration): string {
	const enumName = enumDecl.getName();
	const members = enumDecl.getMembers();

	const hasStringInitializer = members.some((m) =>
		Node.isStringLiteral(m.getInitializer()),
	);

	const swiftType = hasStringInitializer ? "String" : "Int";

	const cases = members
		.map((member) => {
			const name = member.getName();
			if (swiftType === "Int") {
				const value = member.getValue();
				return `  case ${name} = ${String(value)}`;
			}

			// String enums must have string literal initializers in TypeScript
			const initializer = member.getInitializerOrThrow();
			return `  case ${name} = ${initializer.getText()}`;
		})
		.join("\n");

	return `enum ${enumName}: ${swiftType}, Enumerable {\n${cases}\n}`;
}

// Generate Swift enum from an alias that is a union of string/number literals
function generateSwiftEnumFromUnionAlias(alias: TypeAliasDeclaration): string {
	const name = alias.getName();
	const aliasType = alias.getType();
	const unionTypes = aliasType
		.getUnionTypes()
		.filter((t) => !t.isUndefined() && !t.isNull());

	const hasStringInitializer = unionTypes.every((t) => t.isStringLiteral());

	const swiftType = hasStringInitializer ? "String" : "Int";

	const cases = unionTypes
		.map((t) => {
			if (t.isStringLiteral()) {
				const value = String(t.getLiteralValue());
				return `  case ${value} = "${value}"`;
			}
			if (t.isNumberLiteral()) {
				const num = String(t.getLiteralValue());
				return `  case _${num} = ${num}`;
			}
			return "";
		})
		.filter(Boolean)
		.join("\n");

	return `enum ${name}: ${swiftType}, Enumerable {\n${cases}\n}`;
}

/**
 * Generate Swift Record code for a single interface
 */
function generateSwiftRecord(interfaceDecl: InterfaceDeclaration): string {
	const interfaceName = interfaceDecl.getName();
	const properties = interfaceDecl.getProperties();

	if (properties.length === 0) {
		return `public struct ${interfaceName}: Record {}`;
	}

	const propertyFields = properties
		.map((property) => {
			const propertyName = property.getName();
			const propertyType = property.getType();
			// Check if property is optional (either has question token or is union with undefined)
			const isOptional =
				property.hasQuestionToken() || isOptionalUnion(propertyType);

			const { type: swiftType, defaultValue } =
				mapTypeScriptToSwiftType(propertyType);

			const finalSwiftType = isOptional ? `${swiftType}?` : swiftType;
			const finalDefaultValue = isOptional ? "nil" : defaultValue;

			return `  @Field
  var ${propertyName}: ${finalSwiftType} = ${finalDefaultValue}`;
		})
		.join("\n\n");

	return `public struct ${interfaceName}: Record {
${propertyFields}
}`;
}

export function generateSwiftRecords(typescriptCode: string): string {
	const { interfaces, enums, unionAliases } =
		parseTypeScriptDeclarations(typescriptCode);

	const swiftEnums = enums.map(generateSwiftEnum).join("\n\n");
	const swiftAliasEnums = unionAliases
		.map((alias) => generateSwiftEnumFromUnionAlias(alias))
		.join("\n\n");
	const swiftRecords = interfaces.map(generateSwiftRecord).join("\n\n");

	return [swiftEnums, swiftAliasEnums, swiftRecords]
		.filter((s) => Boolean(s))
		.join("\n\n");
}

export function generateKotlinRecords(typescriptCode: string): string {
	const { interfaces } = parseTypeScriptDeclarations(typescriptCode);

	if (interfaces.length === 0) {
		return "";
	}

	// For now, just return a basic structure showing we found the interfaces
	const interfaceNames = interfaces.map((i) => i.getName()).join(", ");
	return `// Found interfaces: ${interfaceNames}
// TODO: Implement full Kotlin generation
class StubRecord : Record {
	@Field
	val notImplemented: String = "parsing works"
}`;
}

export default {
	generateSwiftRecords,
	generateKotlinRecords,
};
