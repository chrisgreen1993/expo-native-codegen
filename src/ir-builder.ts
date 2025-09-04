import {
	type EnumDeclaration,
	type InterfaceDeclaration,
	Node,
	type Type,
	type TypeAliasDeclaration,
} from "ts-morph";
import type {
	IntermediateDeclaration,
	IntermediateEnumDeclaration,
	IntermediateRecordDeclaration,
	IntermediateType,
	RecordProperty,
	TSDeclaration,
} from "./types";

function getTypeName(type: Type): string {
	return type.getSymbol()?.getName() || type.getText();
}

// Coonvert TypeScript types to our intermediate representations
function resolveType(type: Type): IntermediateType {
	const typeName = getTypeName(type);

	if (type.isString()) {
		return { kind: "string" };
	} else if (type.isNumber()) {
		return { kind: "number" };
	} else if (type.isBoolean()) {
		return { kind: "boolean" };
	} else if (type.isAny() && getTypeName(type) === "any") {
		return { kind: "any" };
	} else if (type.getSymbol()?.getName() === "Uint8Array") {
		return { kind: "byte-array" };
	} else if (type.isArray()) {
		// Handle arrays recursively.
		const elementType = type.getArrayElementType();
		if (!elementType) {
			throw new Error(`Array ${typeName} has no element type`);
		}
		return {
			kind: "array",
			elementType: resolveType(elementType),
		};
	} else if (type.getAliasSymbol()?.getName() === "Record") {
		// Handle Record<> types
		const [keyType, valueType] = type.getAliasTypeArguments();
		if (keyType && valueType) {
			return {
				kind: "map",
				keyType: resolveType(keyType),
				valueType: resolveType(valueType),
			};
		}
		throw new Error(`Record type ${typeName} has invalid type arguments`);
	} else if (type.isInterface()) {
		return { kind: "record", name: typeName };
	} else if (type.isEnum()) {
		return { kind: "enum", name: typeName };
	} else if (type.isUnion()) {
		// Check if the union is a named alias (e.g. type Status = "a" | "b")
		const aliasName = type.getAliasSymbol()?.getName();
		if (aliasName) {
			return { kind: "enum", name: aliasName };
		}
		// If no alias name, it's an inline union and we don't support
		throw new Error(`Unsupported inline union type: ${typeName}`);
	}

	throw new Error(`Unsupported TypeScript type: ${typeName}`);
}

function resolveEnumDeclaration(
	enumDecl: EnumDeclaration,
): IntermediateEnumDeclaration {
	const members = enumDecl.getMembers().map((member) => ({
		name: member.getName(),
		value: member.getValue() ?? member.getName(),
	}));

	return {
		kind: "enum",
		name: enumDecl.getName(),
		members,
	};
}

function resolveInterfaceDeclaration(
	interfaceDecl: InterfaceDeclaration,
): IntermediateRecordDeclaration {
	const properties: RecordProperty[] = interfaceDecl
		.getProperties()
		.map((property) => {
			const propertyName = property.getName();
			const propertyType = property.getType();
			const isOptional =
				property.hasQuestionToken() || propertyType.isNullable();

			// Get the non-nullable type (e.g. T | undefined -> T)
			// This allows us to handle the mapping without having to handle nullables ourselves
			const nonNullableType = propertyType.getNonNullableType();
			const resolvedType = resolveType(nonNullableType);

			return {
				name: propertyName,
				type: resolvedType,
				isOptional,
			};
		});

	return {
		kind: "record",
		name: interfaceDecl.getName(),
		properties,
	};
}

function resolveTypeAliasDeclaration(
	aliasDecl: TypeAliasDeclaration,
): IntermediateEnumDeclaration {
	const targetType = aliasDecl.getType();

	// Only support type aliases that are unions of literals
	// These are mapped to enums
	if (!targetType.isUnion()) {
		throw new Error(`Type alias ${aliasDecl.getName()} is not a union type`);
	}

	const unionTypes = targetType.getUnionTypes();

	const members = unionTypes.map((t) => {
		if (t.isStringLiteral() || t.isNumberLiteral()) {
			const value = t.getLiteralValue();
			if (typeof value !== "string" && typeof value !== "number") {
				throw new Error(`Literal value is not a string or number: ${value}`);
			}
			return {
				name: value.toString(),
				value: value,
			};
		}
		throw new Error(
			`Unsupported literal type in type alias ${aliasDecl.getName()}`,
		);
	});

	return {
		kind: "enum",
		name: aliasDecl.getName(),
		members,
	};
}

function resolveDeclaration(decl: TSDeclaration) {
	if (Node.isEnumDeclaration(decl)) {
		return resolveEnumDeclaration(decl);
	} else if (Node.isInterfaceDeclaration(decl)) {
		return resolveInterfaceDeclaration(decl);
	} else if (Node.isTypeAliasDeclaration(decl)) {
		return resolveTypeAliasDeclaration(decl);
	}
}

// Collect all type references from a declaration to determine dependencies
function collectDependencies(decl: IntermediateDeclaration) {
	const dependencies = new Set<string>();

	if (decl.kind === "record") {
		for (const prop of decl.properties) {
			collectTypeDependencies(prop.type, dependencies);
		}
	}
	// Enums don't have dependencies on other declarations

	return Array.from(dependencies);
}

function collectTypeDependencies(
	type: IntermediateType,
	dependencies: Set<string>,
) {
	switch (type.kind) {
		case "enum":
		case "record":
			dependencies.add(type.name);
			break;
		case "array":
			collectTypeDependencies(type.elementType, dependencies);
			break;
		case "map":
			collectTypeDependencies(type.keyType, dependencies);
			collectTypeDependencies(type.valueType, dependencies);
			break;
		// Primitives don't have dependencies
		default:
			break;
	}
}

// Topological sort to order declarations by dependencies
function sortDeclarationsByDependencies(
	declarations: IntermediateDeclaration[],
) {
	const sorted: IntermediateDeclaration[] = [];
	const visited = new Set<string>();
	const visiting = new Set<string>();

	const declMap = new Map(declarations.map((d) => [d.name, d]));

	function visit(decl: IntermediateDeclaration) {
		if (visiting.has(decl.name)) {
			throw new Error(`Circular dependency detected involving ${decl.name}`);
		}
		if (visited.has(decl.name)) {
			return;
		}

		visiting.add(decl.name);
		const dependencies = collectDependencies(decl);

		for (const depName of dependencies) {
			const depDecl = declMap.get(depName);
			if (depDecl) {
				visit(depDecl);
			}
		}

		visiting.delete(decl.name);
		visited.add(decl.name);
		sorted.push(decl);
	}

	for (const decl of declarations) {
		visit(decl);
	}

	return sorted;
}

// Build a language-agnostic intermediate representation of the TypeScript declarations.
// This allows easier mapping to Swift and Kotlin.
export function buildIntermediateRepresentation(declarations: TSDeclaration[]) {
	const seenNames = new Set<string>();

	const allDeclarations = declarations.reduce<IntermediateDeclaration[]>(
		(acc, decl) => {
			const resolved = resolveDeclaration(decl);
			if (resolved) {
				if (seenNames.has(resolved.name)) {
					throw new Error(`Duplicate declaration found: ${resolved.name}`);
				}
				seenNames.add(resolved.name);
				acc.push(resolved);
			}
			return acc;
		},
		[],
	);

	return sortDeclarationsByDependencies(allDeclarations);
}
