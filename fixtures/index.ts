import path from "node:path";
import { fileURLToPath } from "node:url";

// Helper function to get the path to the user example fixtures
export function getUserExamplePath() {
	return path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		"user-example",
	);
}

// Helper function to create test data for TypeScript to Swift/Kotlin generation tests
export function createCodegenFixtures() {
	return {
		stringType: `
export interface StringRecord {
  name: string;
  optionalName?: string;
}`,
		numberType: `
export interface NumberRecord {
  age: number;
  optionalAge?: number;
}`,
		booleanType: `
export interface BooleanRecord {
  isActive: boolean;
	optionalIsActive?: boolean;
}`,
		anyType: `
export interface AnyTypeRecord {
  genericData: any;
  optionalGenericData?: any;
}`,
		unsupportedType: `
export interface UnsupportedTypeRecord {
  unsupportedType: never;
}`,
		stringArray: `
export interface StringArrayRecord {
  tags: string[];
  optionalTags?: string[];
}`,
		numberArray: `
export interface NumberArrayRecord {
  scores: number[];
  optionalScores?: number[];
}`,
		booleanArray: `
export interface BooleanArrayRecord {
  flags: boolean[];
  optionalFlags?: boolean[];
}`,
		stringMap: `
export interface StringMapRecord {
  metadata: Record<string, string>;
  optionalMetadata?: Record<string, string>;
}`,
		anyMap: `
export interface AnyMapRecord {
  config: Record<string, any>;
  optionalConfig?: Record<string, any>;
}`,
		literalStringUnion: `
export interface InlineUnionRecord {
  status: "pending" | "active";
  optionalStatus?: "pending" | "active";
}`,

		numericLiteralUnion: `
export interface PriorityRecord {
  level: 1 | 2 | 3;
  optionalLevel?: 1 | 2 | 3;
}`,
		optionalUnion: `
export interface OptionalUnionRecord {
  description: string | undefined;
  maybeCount: number | null;
}`,
		unionAliasString: `
export type Status = "pending" | "active";

export interface AliasUnionRecord {
  status: Status;
  optionalStatus?: Status;
}`,
		unionAliasNumeric: `
export type Level = 1 | 2 | 3;

export interface PriorityRecord {
  level: Level;
  optionalLevel?: Level;
}`,
		enumType: `
export enum Status {
  pending = "pending",
  active = "active"
}`,
		numericEnumType: `
export enum Direction {
  UP,
  DOWN
}

export enum Status {
  pending = 1,
  active = 2
}`,
		nestedStringEnum: `
export enum Status {
  pending = "PENDING",
  active = "ACTIVE"
}

export interface EnumRecord {
  status: Status;
  priority?: Status;
}`,
		nestedNumericEnum: `
export enum Direction {
  UP,
  DOWN
}

export interface EnumRecord {
  direction: Direction;
  optionalDirection?: Direction;
}
`,
		nestedRecord: `
export interface Address {
  street: string;
  city: string;
}

export interface NestedRecord {
  address: Address;
  billingAddress?: Address;
}`,
		nestedArrayRecord: `
export interface Address {
  street: string;
  city: string;
}

export interface NestedArrayRecord {
  addresses: Address[];
  optionalAddresses?: Address[];
}`,
		objectTypeAlias: `
export type UserProfile = {
	email: string;
	age: number;
}

export type User = {
	profile: UserProfile;
	optionalProfile?: UserProfile;
}`,
		binaryDataRecord: `
export interface BinaryDataRecord {
  data: Uint8Array;
  optionalData?: Uint8Array;
}`,
		emptyRecord: `
export interface EmptyRecord {
}`,
		sortingDeclarations: `
export interface User {
	profile: UserProfile;
	status: Status;
}

export interface UserProfile {
	email: string;
	age: number;
}

export enum Status {
	ACTIVE = "active",
	INACTIVE = "inactive"
}`,
		circularDependency: `
export interface A {
	b: B;
}

export interface B {
	a: A;
}`,
		duplicateDeclarations: `
export interface User {
	name: string;
}

export interface User {
	name: string;
}`,
		namingConflict: `
export interface Status {
	value: string;
}

export enum Status {
	ACTIVE = "active",
	INACTIVE = "inactive"
}`,
	};
}
