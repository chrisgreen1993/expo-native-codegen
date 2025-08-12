import { type InterfaceDeclaration, Project } from "ts-morph";

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
 * Check if a TypeScript type is supported
 */
function isSupportedType(typeText: string): boolean {
	return Object.keys(TYPE_MAPPING).includes(typeText);
}

/**
 * Map TypeScript type to Swift type
 */
const TYPE_MAPPING: Record<string, string> = {
	string: "String",
	number: "Double",
	boolean: "Bool",
	any: "Any",
};

function mapTypeScriptToSwiftType(typeText: string): string {
	return TYPE_MAPPING[typeText] || "Any"; // fallback
}

/**
 * Get default value for Swift type
 */
const DEFAULT_VALUE_MAPPING: Record<string, string> = {
	string: '""',
	number: "0.0",
	boolean: "false",
	any: "[:]",
};

function getSwiftDefaultValue(typeText: string): string {
	return DEFAULT_VALUE_MAPPING[typeText] || "[:]"; // fallback
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

			// Get the type as text and map it to Swift types
			const typeText = propertyType.getText();

			if (!isSupportedType(typeText)) {
				throw new Error(`Unsupported TypeScript type: ${typeText}`);
			}

			const swiftType = mapTypeScriptToSwiftType(typeText);
			let defaultValue = getSwiftDefaultValue(typeText);

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
