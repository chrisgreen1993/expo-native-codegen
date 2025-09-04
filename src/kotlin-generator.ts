import type {
	CodegenConfig,
	IntermediateDeclaration,
	IntermediateEnumDeclaration,
	IntermediateRecordDeclaration,
	IntermediateType,
} from "./types";

interface KotlinType {
	type: string;
	defaultValue: string;
}

function mapIntermediateTypeToKotlin(
	type: IntermediateType,
	declarations: IntermediateDeclaration[],
): KotlinType {
	switch (type.kind) {
		case "string":
			return { type: "String", defaultValue: '""' };
		case "number":
			return { type: "Double", defaultValue: "0.0" };
		case "boolean":
			return { type: "Boolean", defaultValue: "false" };
		case "any":
			return { type: "Any", defaultValue: "mapOf()" };
		case "byte-array":
			return { type: "ByteArray", defaultValue: "ByteArray(0)" };
		case "array": {
			const elementKotlin = mapIntermediateTypeToKotlin(
				type.elementType,
				declarations,
			);
			return { type: `List<${elementKotlin.type}>`, defaultValue: "listOf()" };
		}
		case "map": {
			const valueKotlin = mapIntermediateTypeToKotlin(
				type.valueType,
				declarations,
			);
			const keyKotlin = mapIntermediateTypeToKotlin(type.keyType, declarations);
			return {
				type: `Map<${keyKotlin.type}, ${valueKotlin.type}>`,
				defaultValue: "mapOf()",
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

function generateKotlinEnumFromIR(
	enumDecl: IntermediateEnumDeclaration,
): string {
	if (enumDecl.kind !== "enum") {
		throw new Error("Expected enum declaration");
	}

	const enumName = enumDecl.name;
	const members = enumDecl.members;

	const hasStringInitializer = members.some((m) => typeof m.value === "string");
	const kotlinType = hasStringInitializer ? "String" : "Int";

	const cases = members
		.map((member) => {
			const name = member.name;
			if (kotlinType === "Int") {
				const value = member.value;
				// Numeric type enums are prefixed with an underscores due to Kotlin naming limitations.
				const caseName = name === value.toString() ? `_${name}` : name;
				return `  ${caseName}(${value})`;
			} else {
				const value = member.value;
				return `  ${name}("${value}")`;
			}
		})
		.join(",\n");

	return `enum class ${enumName}(val value: ${kotlinType}) : Enumerable {\n${cases}\n}`;
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
	// Numeric type alias unions are prefixed with an underscores due to Kotlin naming limitations.
	const isNumericTypeAliasUnion =
		typeof firstMember.value === "number" &&
		firstMember.name === firstMember.value.toString();

	const caseName = isNumericTypeAliasUnion
		? `_${firstMember.name}`
		: firstMember.name;

	return `${enumDecl.name}.${caseName}`;
}

function generateKotlinRecordFromIR(
	recordDecl: IntermediateRecordDeclaration,
	allDeclarations: IntermediateDeclaration[],
): string {
	if (recordDecl.kind !== "record") {
		throw new Error("Expected interface declaration");
	}

	const className = recordDecl.name;
	const properties = recordDecl.properties;

	if (properties.length === 0) {
		return `class ${recordDecl.name} : Record {\n}`;
	}

	const propertyFields = properties
		.map((property) => {
			const propertyName = property.name;
			const isOptional = property.isOptional;

			const kotlinType = mapIntermediateTypeToKotlin(
				property.type,
				allDeclarations,
			);
			const finalKotlinType = isOptional
				? `${kotlinType.type}?`
				: kotlinType.type;
			const finalDefaultValue = isOptional ? "null" : kotlinType.defaultValue;

			return `  @Field
  val ${propertyName}: ${finalKotlinType} = ${finalDefaultValue}`;
		})
		.join("\n\n");

	return `class ${className} : Record {
${propertyFields}
}`;
}

export function generateKotlinCodeFromIR(
	irDeclarations: IntermediateDeclaration[],
	config: CodegenConfig["kotlin"],
): string {
	const kotlinEnums = irDeclarations
		.filter((decl) => decl.kind === "enum")
		.map(generateKotlinEnumFromIR)
		.join("\n\n");

	const kotlinRecords = irDeclarations
		.filter((decl) => decl.kind === "record")
		.map((decl) => generateKotlinRecordFromIR(decl, irDeclarations))
		.join("\n\n");

	const kotlinCode = [kotlinEnums, kotlinRecords]
		.filter((s) => Boolean(s))
		.join("\n\n");

	// If there's no Kotlin code to generate, return empty string
	if (!kotlinCode) {
		return "";
	}

	return `package ${config.packageName}

import expo.modules.kotlin.*

${kotlinCode}`;
}
