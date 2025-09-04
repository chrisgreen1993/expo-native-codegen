import type {
	EnumDeclaration,
	InterfaceDeclaration,
	TypeAliasDeclaration,
} from "ts-morph";

export type TSDeclaration =
	| EnumDeclaration
	| InterfaceDeclaration
	| TypeAliasDeclaration;

// Our intermediate representation types so we can easily map to Swift and Kotlin

export type IntermediateType =
	| IntermediateString
	| IntermediateNumber
	| IntermediateBoolean
	| IntermediateEnum
	| IntermediateRecord
	| IntermediateArray
	| IntermediateMap
	| IntermediateByteArray
	| IntermediateAny;

interface IntermediateTypeBase {
	kind: IntermediateType["kind"];
}

export interface IntermediateString extends IntermediateTypeBase {
	kind: "string";
}
export interface IntermediateNumber extends IntermediateTypeBase {
	kind: "number";
}
export interface IntermediateBoolean extends IntermediateTypeBase {
	kind: "boolean";
}

export interface IntermediateEnum extends IntermediateTypeBase {
	kind: "enum";
	name: string;
}
export interface IntermediateRecord extends IntermediateTypeBase {
	kind: "record";
	name: string;
}

export interface IntermediateByteArray extends IntermediateTypeBase {
	kind: "byte-array";
}

export interface IntermediateAny extends IntermediateTypeBase {
	kind: "any";
}

export interface IntermediateArray extends IntermediateTypeBase {
	kind: "array";
	elementType: IntermediateType;
}

export interface IntermediateMap extends IntermediateTypeBase {
	kind: "map";
	keyType: IntermediateType;
	valueType: IntermediateType;
}

// These are the actual declarations we generate, currently only enums and records.
export type IntermediateDeclaration =
	| IntermediateEnumDeclaration
	| IntermediateRecordDeclaration;

interface IntermediateDeclarationBase {
	kind: IntermediateDeclaration["kind"];
	name: string;
}

export interface IntermediateEnumDeclaration
	extends IntermediateDeclarationBase {
	kind: "enum";
	name: string;
	members: { name: string; value: string | number }[];
}

export interface IntermediateRecordDeclaration
	extends IntermediateDeclarationBase {
	kind: "record";
	name: string;
	properties: RecordProperty[];
}

export interface RecordProperty {
	name: string;
	type: IntermediateType;
	isOptional: boolean;
}
