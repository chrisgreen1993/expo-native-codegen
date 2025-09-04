import { Project } from "ts-morph";
import { buildIntermediateRepresentation } from "./ir-builder";
import type {
	IntermediateDeclaration,
	IntermediateEnumDeclaration,
	IntermediateRecordDeclaration,
	IntermediateType,
	TSDeclaration,
} from "./types";

interface SwiftType {
	type: string;
	defaultValue: string;
}

export function getDeclarations(typescriptCode: string): TSDeclaration[] {
	if (!typescriptCode.trim()) return [];

	const project = new Project({
		useInMemoryFileSystem: true,
		compilerOptions: { strictNullChecks: true },
	});
	const sourceFile = project.createSourceFile("input.ts", typescriptCode);

	return [
		...sourceFile.getInterfaces(),
		...sourceFile.getEnums(),
		...sourceFile.getTypeAliases(),
	];
}

function mapIntermediateTypeToSwift(
	type: IntermediateType,
	declarations: IntermediateDeclaration[],
): SwiftType {
	switch (type.kind) {
		case "string":
			return { type: "String", defaultValue: '""' };
		case "number":
			return { type: "Double", defaultValue: "0.0" };
		case "boolean":
			return { type: "Bool", defaultValue: "false" };
		case "any":
			return { type: "Any", defaultValue: "[:]" };
		case "byte-array":
			return { type: "Data", defaultValue: "Data()" };
		case "array": {
			const elementSwift = mapIntermediateTypeToSwift(
				type.elementType,
				declarations,
			);
			return { type: `[${elementSwift.type}]`, defaultValue: "[]" };
		}
		case "map": {
			const valueSwift = mapIntermediateTypeToSwift(
				type.valueType,
				declarations,
			);
			const keySwift = mapIntermediateTypeToSwift(type.keyType, declarations);
			return {
				type: `[${keySwift.type}: ${valueSwift.type}]`,
				defaultValue: "[:]",
			};
		}
		case "enum": {
			// Find the enum declaration and get the default value
			const enumDecl = declarations.find(
				(d) => d.kind === "enum" && d.name === type.name,
			);
			if (enumDecl && enumDecl.kind === "enum") {
				const defaultValue = getEnumDefaultValue(enumDecl);
				return { type: type.name, defaultValue };
			}
			return { type: type.name, defaultValue: `${type.name}()` };
		}
		case "record":
			return { type: type.name, defaultValue: `${type.name}()` };
		default: {
			const _exhaustiveCheck: never = type as never;
			throw new Error("Unsupported intermediate type");
		}
	}
}

function generateSwiftEnumFromIR(
	enumDecl: IntermediateEnumDeclaration,
): string {
	if (enumDecl.kind !== "enum") {
		throw new Error("Expected enum declaration");
	}

	const enumName = enumDecl.name;
	const members = enumDecl.members;

	const hasStringInitializer = members.some((m) => typeof m.value === "string");
	const swiftType = hasStringInitializer ? "String" : "Int";

	const cases = members
		.map((member) => {
			const name = member.name;
			if (swiftType === "Int") {
				const value = member.value;
				// Numeric type enums are prefixed with an underscores due to Swift naming limitations.
				const caseName = name === value.toString() ? `_${name}` : name;
				return `  case ${caseName} = ${value}`;
			} else {
				const value = member.value;
				return `  case ${name} = "${value}"`;
			}
		})
		.join("\n");

	return `enum ${enumName}: ${swiftType}, Enumerable {\n${cases}\n}`;
}

// The enum default value is the first member's value.
function getEnumDefaultValue(enumDecl: IntermediateEnumDeclaration): string {
	if (enumDecl.kind !== "enum") {
		throw new Error("Expected enum declaration");
	}

	const firstMember = enumDecl.members[0];
	if (!firstMember) {
		throw new Error(`Enum ${enumDecl.name} has no members`);
	}

	// Check if this is a numeric type alias union (name matches value) vs regular enum
	// Numeric type alias unions are prefixed with an underscores due to Swift naming limitations.
	const isNumericTypeAliasUnion =
		typeof firstMember.value === "number" &&
		firstMember.name === firstMember.value.toString();

	const caseName = isNumericTypeAliasUnion
		? `_${firstMember.name}`
		: firstMember.name;

	return `.${caseName}`;
}

function generateSwiftRecordFromIR(
	recordDecl: IntermediateRecordDeclaration,
	allDeclarations: IntermediateDeclaration[],
): string {
	if (recordDecl.kind !== "record") {
		throw new Error("Expected interface declaration");
	}

	const interfaceName = recordDecl.name;
	const properties = recordDecl.properties;

	if (properties.length === 0) {
		return `public struct ${recordDecl.name}: Record {}`;
	}

	const propertyFields = properties
		.map((property) => {
			const propertyName = property.name;
			const isOptional = property.isOptional;

			const swiftType = mapIntermediateTypeToSwift(
				property.type,
				allDeclarations,
			);
			const finalSwiftType = isOptional ? `${swiftType.type}?` : swiftType.type;
			const finalDefaultValue = isOptional ? "nil" : swiftType.defaultValue;

			return `  @Field
  var ${propertyName}: ${finalSwiftType} = ${finalDefaultValue}`;
		})
		.join("\n\n");

	return `public struct ${interfaceName}: Record {
${propertyFields}
}`;
}

export function generateSwiftCode(typescriptCode: string): string {
	const declarations = getDeclarations(typescriptCode);
	const irDeclarations = buildIntermediateRepresentation(declarations);

	const swiftEnums = irDeclarations
		.filter((decl) => decl.kind === "enum")
		.map(generateSwiftEnumFromIR)
		.join("\n\n");

	const swiftRecords = irDeclarations
		.filter((decl) => decl.kind === "record")
		.map((decl) => generateSwiftRecordFromIR(decl, irDeclarations))
		.join("\n\n");

	const swiftCode = [swiftEnums, swiftRecords]
		.filter((s) => Boolean(s))
		.join("\n\n");

	// If there's no Swift code to generate, return empty string
	if (!swiftCode) {
		return "";
	}

	return `import ExpoModulesCore

${swiftCode}`;
}

export function generateKotlinCode(_typescriptCode: string): string {
	return "";
}

export default {
	generateSwiftCode,
	generateKotlinCode,
};
