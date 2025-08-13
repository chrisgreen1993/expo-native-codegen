import { type InterfaceDeclaration, Project, type Type } from "ts-morph";

function getTypeName(type: Type): string {
	return type.getSymbol()?.getName() || type.getText();
}

/**
 * Parse TypeScript code and extract all interface declarations
 */
function parseInterfaces(typescriptCode: string): InterfaceDeclaration[] {
	if (!typescriptCode.trim()) {
		return [];
	}

	const project = new Project({
		useInMemoryFileSystem: true,
	});
	const sourceFile = project.createSourceFile("input.ts", typescriptCode);

	// Find all interface declarations
	const interfaces = sourceFile.getInterfaces();

	return interfaces;
}

/**
 * Convert TypeScript type to Swift type recursively
 */
function mapTypeScriptToSwiftType(propertyType: Type): string {
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

	// Get the base type name
	const typeName = getTypeName(propertyType);

	return TYPE_MAPPING[typeName] || typeName; // Default to the type name for interfaces
}

/**
 * Check if a TypeScript type is supported for conversion to Swift
 */
function isSupportedType(propertyType: Type): boolean {
	// Check if it's an array type
	if (propertyType.isArray()) {
		const arrayElementType = propertyType.getArrayElementType();
		return arrayElementType ? isSupportedType(arrayElementType) : false;
	}

	if (propertyType.isInterface()) {
		return true;
	}

	if (isRecordType(propertyType)) {
		const [keyType, valueType] = getRecordTypeArguments(propertyType);
		if (keyType && valueType) {
			return isSupportedType(keyType) && isSupportedType(valueType);
		}
		return false;
	}

	const typeText = propertyType.getText();
	return typeText in TYPE_MAPPING;
}

function isRecordType(type: Type): boolean {
	return type.getAliasSymbol()?.getName() === "Record";
}

function getRecordTypeArguments(type: Type): [Type?, Type?] {
	const aliasTypeArguments = type.getAliasTypeArguments();
	return [aliasTypeArguments[0], aliasTypeArguments[1]];
}

/**
 * Map TypeScript type to Swift type
 */
const TYPE_MAPPING: Record<string, string> = {
	string: "String",
	number: "Double",
	boolean: "Bool",
	any: "Any",
	UInt8Array: "Data",
};

/**
 * Get default value for Swift type
 */
const DEFAULT_VALUE_MAPPING: Record<string, string> = {
	string: '""',
	number: "0.0",
	boolean: "false",
	any: "[:]",
	UInt8Array: "Data()",
};

function getSwiftDefaultValue(propertyType: Type): string {
	// Check if it's an array type
	if (propertyType.isArray()) {
		return "[]";
	}

	if (isRecordType(propertyType)) {
		return "[:]";
	}

	// Handle non-array types
	const typeText = getTypeName(propertyType);
	return DEFAULT_VALUE_MAPPING[typeText] || `${typeText}()`;
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

			if (!isSupportedType(propertyType)) {
				const typeText = getTypeName(propertyType);
				throw new Error(`Unsupported TypeScript type: ${typeText}`);
			}

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
	const interfaces = parseInterfaces(typescriptCode);

	if (interfaces.length === 0) {
		return "";
	}

	// Generate Swift Records for each interface
	const swiftRecords = interfaces.map(generateSwiftRecord).join("\n\n");

	return swiftRecords;
}

export function generateKotlinRecords(typescriptCode: string): string {
	const interfaces = parseInterfaces(typescriptCode);

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
