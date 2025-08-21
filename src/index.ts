import {
	type EnumDeclaration,
	type InterfaceDeclaration,
	Node,
	Project,
	type Type,
	type TypeAliasDeclaration,
} from "ts-morph";

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
/**
 * Convert TypeScript type to Swift type recursively
 */
function mapTypeScriptToSwiftType(propertyType: Type): string {
	if (propertyType.isUnion()) {
		const unionTypes = propertyType.getUnionTypes();
		// optional properties are expanded to a union type of the property type and undefined
		const nonNullishTypes = unionTypes.filter(
			(type) => !type.isUndefined() && !type.isNull(),
		);

		// If this union comes from a named alias (e.g., type Status = "a" | "b"),
		const nonNullableType = propertyType.getNonNullableType();
		const aliasName = nonNullableType.getAliasSymbol()?.getName();
		if (aliasName && nonNullableType.isUnion()) {
			return aliasName;
		}

		const swiftTypes = nonNullishTypes.map((type) =>
			mapTypeScriptToSwiftType(type),
		);
		// Deduplicate the resulting types (e.g true | false -> Bool)
		const [swiftType] = [...new Set(swiftTypes)];
		if (swiftType) {
			return swiftType;
		}
		throw new Error(`Unsupported union type: ${getTypeName(propertyType)}`);
	}

	// get the base type of an enum literal (e.g pending -> Status)
	if (propertyType.isEnumLiteral()) {
		return getTypeName(propertyType.getBaseTypeOfLiteralType());
	}

	if (propertyType.isString()) {
		return "String";
	}
	if (propertyType.isNumber()) {
		return "Double";
	}
	if (propertyType.isBoolean() || propertyType.isBooleanLiteral()) {
		return "Bool";
	}
	// Check if it's actually the 'any' type, not just any type
	if (propertyType.isAny() && getTypeName(propertyType) === "any") {
		return "Any";
	}
	if (isUint8Array(propertyType)) {
		return "Data";
	}

	// Handle array types recursively
	if (propertyType.isArray()) {
		const elementType = propertyType.getArrayElementType();
		return elementType ? `[${mapTypeScriptToSwiftType(elementType)}]` : "[Any]";
	}

	if (isRecordType(propertyType)) {
		const [keyType, valueType] = getRecordTypeArguments(propertyType);
		if (keyType && valueType) {
			const swiftKeyType = mapTypeScriptToSwiftType(keyType);
			const swiftValueType = mapTypeScriptToSwiftType(valueType);
			return `[${swiftKeyType}: ${swiftValueType}]`;
		}
	}

	if (propertyType.isInterface()) {
		return getTypeName(propertyType);
	}

	if (propertyType.isEnum()) {
		return getTypeName(propertyType);
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

/**
 * Get default value for Swift type
 */
const DEFAULT_VALUE_MAPPING: Record<string, string> = {
	string: '""',
	number: "0.0",
	boolean: "false",
	any: "[:]",
	Uint8Array: "Data()",
};

function getSwiftDefaultValue(propertyType: Type): string {
	// Check if it's an array type
	if (propertyType.isArray()) {
		return "[]";
	}

	if (isRecordType(propertyType)) {
		return "[:]";
	}

	// Enums default to first case, e.g. .pending (detect via symbol declarations)
	const symbol = propertyType.getSymbol();
	const enumDecl = symbol?.getDeclarations().find(Node.isEnumDeclaration);
	const firstMemberName = enumDecl?.getMembers()[0]?.getName();
	if (firstMemberName) {
		return `.${firstMemberName}`;
	}

	// If this is a union alias like type Status = "a" | "b",
	// choose the first literal as the default case.
	if (propertyType.isUnion() && propertyType.getNonNullableType().isUnion()) {
		const unionTypes = propertyType
			.getUnionTypes()
			.filter((t) => !t.isUndefined() && !t.isNull());
		const first = unionTypes[0];
		if (first?.isStringLiteral()) {
			const literal = String(first.getLiteralValue());
			return `.${literal}`;
		}
		if (first?.isNumberLiteral()) {
			const value = String(first.getLiteralValue());
			// Numeric case names in Swift enums are prefixed with underscore
			return `._${value}`;
		}
	}

	// Handle non-array types
	const typeText = getTypeName(propertyType);
	return DEFAULT_VALUE_MAPPING[typeText] || `${typeText}()`;
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

			const swiftType = mapTypeScriptToSwiftType(propertyType);
			let defaultValue = getSwiftDefaultValue(propertyType);

			// Handle optional types
			if (isOptional) {
				defaultValue = "nil";
			}

			const finalSwiftType = isOptional ? `${swiftType}?` : swiftType;

			return `  @Field
  var ${propertyName}: ${finalSwiftType} = ${defaultValue}`;
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
