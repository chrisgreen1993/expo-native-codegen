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

	return null;
}

// Build a language-agnostic intermediate representation of the TypeScript declarations.
// This allows easier mapping to Swift and Kotlin.
export function buildIntermediateRepresentation(declarations: TSDeclaration[]) {
	const declarationMap = new Map<string, IntermediateDeclaration>();
	for (const decl of declarations) {
		const resolved = resolveDeclaration(decl);
		if (resolved) {
			const existing = declarationMap.get(resolved.name);
			if (!existing) {
				declarationMap.set(resolved.name, resolved);
			} else if (existing.kind !== resolved.kind) {
				throw new Error(
					`Conflicting kinds for ${resolved.name}: ${existing.kind} vs ${resolved.kind}`,
				);
			}
		}
	}

	return Array.from(declarationMap.values());
}
