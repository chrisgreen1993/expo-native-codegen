import { describe, expect, it } from "bun:test";
import { generateKotlinRecords, generateSwiftRecords } from "./index";

// Helper function to create test data
function createTestData() {
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
		binaryDataRecord: `
export interface BinaryDataRecord {
  data: Uint8Array;
  optionalData?: Uint8Array;
}`,
		emptyRecord: `
export interface EmptyRecord {
}`,
	};
}

describe("Swift Record Generation", () => {
	const testData = createTestData();

	describe("Primitive types", () => {
		it("should handle string type", () => {
			const result = generateSwiftRecords(testData.stringType);
			expect(result).toMatchInlineSnapshot(`
			  "public struct StringRecord: Record {
			    @Field
			    var name: String = ""

			    @Field
			    var optionalName: String? = nil
			  }"
			`);
		});

		it("should handle number type", () => {
			const result = generateSwiftRecords(testData.numberType);
			expect(result).toMatchInlineSnapshot(`
			  "public struct NumberRecord: Record {
			    @Field
			    var age: Double = 0.0

			    @Field
			    var optionalAge: Double? = nil
			  }"
			`);
		});

		it("should handle boolean type", () => {
			const result = generateSwiftRecords(testData.booleanType);
			expect(result).toMatchInlineSnapshot(`
			  "public struct BooleanRecord: Record {
			    @Field
			    var isActive: Bool = false

			    @Field
			    var optionalIsActive: Bool? = nil
			  }"
			`);
		});

		it("should handle any type", () => {
			const result = generateSwiftRecords(testData.anyType);
			expect(result).toMatchInlineSnapshot(`
			  "public struct AnyTypeRecord: Record {
			    @Field
			    var genericData: Any = [:]

			    @Field
			    var optionalGenericData: Any? = nil
			  }"
			`);
		});
	});

	describe("Array types", () => {
		it("should handle string array", () => {
			const result = generateSwiftRecords(testData.stringArray);
			expect(result).toMatchInlineSnapshot(`
			  "public struct StringArrayRecord: Record {
			    @Field
			    var tags: [String] = []

			    @Field
			    var optionalTags: [String]? = nil
			  }"
			`);
		});

		it("should handle number array", () => {
			const result = generateSwiftRecords(testData.numberArray);
			expect(result).toMatchInlineSnapshot(`
			  "public struct NumberArrayRecord: Record {
			    @Field
			    var scores: [Double] = []

			    @Field
			    var optionalScores: [Double]? = nil
			  }"
			`);
		});

		it("should handle boolean array", () => {
			const result = generateSwiftRecords(testData.booleanArray);
			expect(result).toMatchInlineSnapshot(`
			  "public struct BooleanArrayRecord: Record {
			    @Field
			    var flags: [Bool] = []

			    @Field
			    var optionalFlags: [Bool]? = nil
			  }"
			`);
		});
	});

	describe("Map/Object types", () => {
		it("should handle Record<string, string>", () => {
			const result = generateSwiftRecords(testData.stringMap);
			expect(result).toMatchInlineSnapshot(`
			  "public struct StringMapRecord: Record {
			    @Field
			    var metadata: [String: String] = [:]

			    @Field
			    var optionalMetadata: [String: String]? = nil
			  }"
			`);
		});

		it("should handle Record<string, any>", () => {
			const result = generateSwiftRecords(testData.anyMap);
			expect(result).toMatchInlineSnapshot(`
			  "public struct AnyMapRecord: Record {
			    @Field
			    var config: [String: Any] = [:]

			    @Field
			    var optionalConfig: [String: Any]? = nil
			  }"
			`);
		});
	});

	describe("Enum types", () => {
		it("should handle string enum", () => {
			const result = generateSwiftRecords(testData.enumType);
			expect(result).toMatchInlineSnapshot(`
			  "enum Status: String, Enumerable {
			    case pending = "pending"
			    case active = "active"
			  }"
			`);
		});

		it("should handle numeric enum", () => {
			const result = generateSwiftRecords(testData.numericEnumType);
			expect(result).toMatchInlineSnapshot(`
			  "enum Direction: Int, Enumerable {
			    case UP = 0
			    case DOWN = 1
			  }

			  enum Status: Int, Enumerable {
			    case pending = 1
			    case active = 2
			  }"
			`);
		});

		it("should handle string enum within record", () => {
			const result = generateSwiftRecords(testData.nestedStringEnum);
			expect(result).toMatchInlineSnapshot(`
			  "enum Status: String, Enumerable {
			    case pending = "PENDING"
			    case active = "ACTIVE"
			  }

			  public struct EnumRecord: Record {
			    @Field
			    var status: Status = .pending

			    @Field
			    var priority: Status? = nil
			  }"
			`);
		});

		it("should handle numeric enum within record", () => {
			const result = generateSwiftRecords(testData.nestedNumericEnum);
			expect(result).toMatchInlineSnapshot(`
			  "enum Direction: Int, Enumerable {
			    case UP = 0
			    case DOWN = 1
			  }

			  public struct EnumRecord: Record {
			    @Field
			    var direction: Direction = .UP

			    @Field
			    var optionalDirection: Direction? = nil
			  }"
			`);
		});
	});

	describe("Union types", () => {
		it("should treat null/undefined unions as optional of base type", () => {
			const result = generateSwiftRecords(testData.optionalUnion);
			expect(result).toMatchInlineSnapshot(`
			  "public struct OptionalUnionRecord: Record {
			    @Field
			    var description: String? = nil

			    @Field
			    var maybeCount: Double? = nil
			  }"
			`);
		});

		it("should create enum from string literal union alias", () => {
			const result = generateSwiftRecords(testData.unionAliasString);
			expect(result).toMatchInlineSnapshot(`
			  "enum Status: String, Enumerable {
			    case pending = \"pending\"
			    case active = \"active\"
			  }

			  public struct AliasUnionRecord: Record {
			    @Field
			    var status: Status = .pending

			    @Field
			    var optionalStatus: Status? = nil
			  }"
			`);
		});

		it("should create enum from numeric literal union alias", () => {
			const result = generateSwiftRecords(testData.unionAliasNumeric);
			expect(result).toMatchInlineSnapshot(`
			  "enum Level: Int, Enumerable {
			    case _1 = 1
			    case _2 = 2
			    case _3 = 3
			  }

			  public struct PriorityRecord: Record {
			    @Field
			    var level: Level = ._1

			    @Field
			    var optionalLevel: Level? = nil
			  }"
			`);
		});

		it.todo(
			"should synthesize enum from string literal union and handle optional",
			() => {
				const result = generateSwiftRecords(testData.literalStringUnion);
				expect(result).toMatchInlineSnapshot(`
			  "enum Pending_Active_Union: String, Enumerable {
			    case pending = \"pending\"
			    case active = \"active\"
			  }

			  public struct InlineUnionRecord: Record {
			    @Field
			    var status: Pending_Active_Union = .pending

			    @Field
			    var optionalStatus: Pending_Active_Union? = nil
			  }"
			`);
			},
		);

		it.todo(
			"should handle numeric literal unions with content-based naming",
			() => {
				const result = generateSwiftRecords(testData.numericLiteralUnion);
				expect(result).toMatchInlineSnapshot(`
			  "enum 1_2_3_NumericUnion: Int, Enumerable {
			    case _1 = 1
			    case _2 = 2
			    case _3 = 3
			  }

			  public struct PriorityRecord: Record {
			    @Field
			    var level: 1_2_3_NumericUnion = ._1

			    @Field
			    var optionalLevel: 1_2_3_NumericUnion? = nil
			  }"
			`);
			},
		);
	});

	describe("Binary data handling", () => {
		it("should handle Uint8Array", () => {
			const result = generateSwiftRecords(testData.binaryDataRecord);
			expect(result).toMatchInlineSnapshot(`
			  "public struct BinaryDataRecord: Record {
			    @Field
			    var data: Data = Data()

			    @Field
			    var optionalData: Data? = nil
			  }"
			`);
		});
	});

	describe("Nested records", () => {
		it("should handle nested interface", () => {
			const result = generateSwiftRecords(testData.nestedRecord);
			expect(result).toMatchInlineSnapshot(`
			  "public struct Address: Record {
			    @Field
			    var street: String = ""

			    @Field
			    var city: String = ""
			  }

			  public struct NestedRecord: Record {
			    @Field
			    var address: Address = Address()

			    @Field
			    var billingAddress: Address? = nil
			  }"
			`);
		});

		it("should handle nested interface array", () => {
			const result = generateSwiftRecords(testData.nestedArrayRecord);
			expect(result).toMatchInlineSnapshot(`
			  "public struct Address: Record {
			    @Field
			    var street: String = ""

			    @Field
			    var city: String = ""
			  }

			  public struct NestedArrayRecord: Record {
			    @Field
			    var addresses: [Address] = []

			    @Field
			    var optionalAddresses: [Address]? = nil
			  }"
			`);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty TypeScript code", () => {
			const result = generateSwiftRecords("");
			expect(result).toBe("");
		});

		it("should handle interface with no properties", () => {
			const result = generateSwiftRecords(testData.emptyRecord);
			expect(result).toMatchInlineSnapshot(
				`"public struct EmptyRecord: Record {}"`,
			);
		});

		it("should throw error for unsupported types", () => {
			expect(() => generateSwiftRecords(testData.unsupportedType)).toThrow(
				"Unsupported TypeScript type: never",
			);
		});
	});
});

describe.todo("Kotlin Record Generation", () => {
	const testData = createTestData();

	describe("Primitive types", () => {
		it("should handle string type", () => {
			const result = generateKotlinRecords(testData.stringType);
			expect(result).toMatchInlineSnapshot(`
			  "class StringRecord : Record {
			    @Field
			    val name: String = ""

			    @Field
			    val optionalName: String? = null
			  }"
			`);
		});

		it("should handle number type", () => {
			const result = generateKotlinRecords(testData.numberType);
			expect(result).toMatchInlineSnapshot(`
			  "class NumberRecord : Record {
			    @Field
			    val age: Double = 0.0

			    @Field
			    val optionalAge: Double? = null
			  }"
			`);
		});

		it("should handle boolean type", () => {
			const result = generateKotlinRecords(testData.booleanType);
			expect(result).toMatchInlineSnapshot(`
			  "class BooleanRecord : Record {
			    @Field
			    val isActive: Boolean = false

			    @Field
			    val optionalIsActive: Boolean? = null
			  }"
			`);
		});
	});

	describe("Array types", () => {
		it("should handle string array", () => {
			const result = generateKotlinRecords(testData.stringArray);
			expect(result).toMatchInlineSnapshot(`
			  "class StringArrayRecord : Record {
			    @Field
			    val tags: List<String> = listOf()

			    @Field
			    val optionalTags: List<String>? = null
			  }"
			`);
		});

		it("should handle number array", () => {
			const result = generateKotlinRecords(testData.numberArray);
			expect(result).toMatchInlineSnapshot(`
			  "class NumberArrayRecord : Record {
			    @Field
			    val scores: List<Double> = listOf()

			    @Field
			    val optionalScores: List<Double>? = null
			  }"
			`);
		});

		it("should handle boolean array", () => {
			const result = generateKotlinRecords(testData.booleanArray);
			expect(result).toMatchInlineSnapshot(`
			  "class BooleanArrayRecord : Record {
			    @Field
			    val flags: List<Boolean> = listOf()

			    @Field
			    val optionalFlags: List<Boolean>? = null
			  }"
			`);
		});
	});

	describe("Map/Object types", () => {
		it("should handle Record<string, string>", () => {
			const result = generateKotlinRecords(testData.stringMap);
			expect(result).toMatchInlineSnapshot(`
			  "class StringMapRecord : Record {
			    @Field
			    val metadata: Map<String, String> = mapOf()

			    @Field
			    val optionalMetadata: Map<String, String>? = null
			  }"
			`);
		});

		it("should handle Record<string, any>", () => {
			const result = generateKotlinRecords(testData.anyMap);
			expect(result).toMatchInlineSnapshot(`
			  "class AnyMapRecord : Record {
			    @Field
			    val config: Map<String, Any> = mapOf()

			    @Field
			    val optionalConfig: Map<String, Any>? = null
			  }"
			`);
		});
	});

	describe("Enum types", () => {
		it("should handle string enum", () => {
			const result = generateKotlinRecords(testData.enumType);
			expect(result).toMatchInlineSnapshot(`
			  "enum class Status(val value: String) : Enumerable {
			    PENDING("pending"),
			    ACTIVE("active")
			  }

			  class EnumRecord : Record {
			    @Field
			    val status: Status = Status.PENDING

			    @Field
			    val priority: Status? = null
			  }"
			`);
		});
	});

	describe("Binary data handling", () => {
		it("should handle Uint8Array", () => {
			const result = generateKotlinRecords(testData.binaryDataRecord);
			expect(result).toMatchInlineSnapshot(`
			  "class BinaryDataRecord : Record {
			    @Field
			    val data: ByteArray = ByteArray(0)

			    @Field
			    val optionalData: ByteArray? = null
			  }"
			`);
		});
	});

	describe("Nested records", () => {
		it("should handle nested interface", () => {
			const result = generateKotlinRecords(testData.nestedRecord);
			expect(result).toMatchInlineSnapshot(`
			  "class Address : Record {
			    @Field
			    val street: String = ""

			    @Field
			    val city: String = ""
			  }

			  class NestedRecord : Record {
			    @Field
			    val address: Address = Address()

			    @Field
			    val billingAddress: Address? = null
			  }"
			`);
		});

		it("should handle nested interface array", () => {
			const result = generateKotlinRecords(testData.nestedArrayRecord);
			expect(result).toMatchInlineSnapshot(`
			  "class Address : Record {
			    @Field
			    val street: String = ""

			    @Field
			    val city: String = ""
			  }

			  class NestedArrayRecord : Record {
			    @Field
			    val addresses: List<Address> = listOf()

			    @Field
			    val optionalAddresses: List<Address>? = null
			  }"
			`);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty TypeScript code", () => {
			const result = generateKotlinRecords("");
			expect(result).toBe("");
		});

		it("should handle interface with no properties", () => {
			const result = generateKotlinRecords(testData.emptyRecord);
			expect(result).toMatchInlineSnapshot(`
			  "class EmptyRecord : Record {
			  }"
			`);
		});
	});
});
