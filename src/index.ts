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

/**
 * Convert TypeScript type to Swift type recursively
 */
function mapTypeScriptToSwiftType(type: Type): SwiftType {
	if (type.isString()) {
		return { type: "String", defaultValue: '""' };
	} else if (type.isNumber()) {
		return { type: "Double", defaultValue: "0.0" };
	} else if (type.isBoolean() || type.isBooleanLiteral()) {
		return { type: "Bool", defaultValue: "false" };
	} else if (type.isAny() && getTypeName(type) === "any") {
		return { type: "Any", defaultValue: "[:]" };
	} else if (type.getSymbol()?.getName() === "Uint8Array") {
		return { type: "Data", defaultValue: "Data()" };
	} else if (type.isArray()) {
		// Handle array types recursively
		const elementType = type.getArrayElementType();
		if (!elementType) {
			throw new Error(`Array ${getTypeName(type)} has no element type`);
		}
		return {
			type: `[${mapTypeScriptToSwiftType(elementType).type}]`,
			defaultValue: "[]",
		};
	} else if (type.getAliasSymbol()?.getName() === "Record") {
		// Handle Record<> types
		const [keyType, valueType] = type.getAliasTypeArguments();
		if (keyType && valueType) {
			const swiftKeyType = mapTypeScriptToSwiftType(keyType);
			const swiftValueType = mapTypeScriptToSwiftType(valueType);
			return {
				type: `[${swiftKeyType.type}: ${swiftValueType.type}]`,
				defaultValue: "[:]",
			};
		}
		throw new Error(
			`Record type ${getTypeName(type)} has invalid type arguments`,
		);
	} else if (type.isInterface()) {
		const interfaceName = getTypeName(type);
		return { type: interfaceName, defaultValue: `${interfaceName}()` };
	} else if (type.isEnum()) {
		const enumDecl = type
			.getSymbolOrThrow()
			.getDeclarations()
			.find(Node.isEnumDeclaration);
		if (!enumDecl) {
			throw new Error(`Enum ${getTypeName(type)} not found`);
		}
		return {
			type: getTypeName(type),
			defaultValue: getEnumDefaultValue(enumDecl),
		};
	} else if (type.isUnion()) {
		// Check if the union is a named alias (e.g. type Status = "a" | "b")
		const aliasName = type.getAliasSymbol()?.getName();
		if (aliasName) {
			const unionTypes = type.getUnionTypes();
			const defaultValue = getUnionAliasDefaultValue(unionTypes);
			return { type: aliasName, defaultValue };
		}
		// If no alias name, it's an inline union and we don't support
		throw new Error(`Unsupported inline union type: ${getTypeName(type)}`);
	} else {
		throw new Error(`Unsupported TypeScript type: ${getTypeName(type)}`);
	}
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
			// Check if property is optional (either has question token or is nullable (e.g T | undefined))
			const isOptional =
				property.hasQuestionToken() || propertyType.isNullable();

			// Get the non-nullable type (e.g. T | undefined -> T)
			// This allows us to handle the mapping without having to handle nullables ourselves
			const nonNullablePropertyType = propertyType.getNonNullableType();

			const { type: swiftType, defaultValue } = mapTypeScriptToSwiftType(
				nonNullablePropertyType,
			);

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
