import {
	type EnumDeclaration,
	type InterfaceDeclaration,
	Node,
	Project,
	type Type,
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
} {
	if (!typescriptCode.trim()) {
		return { interfaces: [], enums: [] };
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
	};
}

function isUint8Array(propertyType: Type): boolean {
	return getTypeName(propertyType) === "Uint8Array";
}
/**
 * Convert TypeScript type to Swift type recursively
 */
function mapTypeScriptToSwiftType(propertyType: Type): string {
	// optional properties are expanded to a union type of the property type and undefined
	if (propertyType.isUnion()) {
		const unionTypes = propertyType.getUnionTypes();

		const nonUndefinedTypes = unionTypes.filter((type) => !type.isUndefined());
		const swiftTypes = nonUndefinedTypes.map((type) =>
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
			const isOptional = property.hasQuestionToken();

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
	const { interfaces, enums } = parseTypeScriptDeclarations(typescriptCode);

	const swiftEnums = enums.map(generateSwiftEnum).join("\n\n");
	const swiftRecords = interfaces.map(generateSwiftRecord).join("\n\n");

	return [swiftEnums, swiftRecords].filter(Boolean).join("\n\n");
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
