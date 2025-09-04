import { describe, expect, it } from "bun:test";
import { generateKotlinCode } from "./index";
import { createTestData } from "./test-fixtures";

describe("Kotlin Code Generation", () => {
	const testData = createTestData();

	const config = { kotlin: { packageName: "expo.modules.testmodule" } };

	describe("Primitive types", () => {
		it("should handle string type", () => {
			const result = generateKotlinCode(testData.stringType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class StringRecord : Record {
			    @Field
			    val name: String = ""

			    @Field
			    val optionalName: String? = null
			  }"
			`);
		});

		it("should handle number type", () => {
			const result = generateKotlinCode(testData.numberType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class NumberRecord : Record {
			    @Field
			    val age: Double = 0.0

			    @Field
			    val optionalAge: Double? = null
			  }"
			`);
		});

		it("should handle boolean type", () => {
			const result = generateKotlinCode(testData.booleanType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class BooleanRecord : Record {
			    @Field
			    val isActive: Boolean = false

			    @Field
			    val optionalIsActive: Boolean? = null
			  }"
			`);
		});

		it("should handle any type", () => {
			const result = generateKotlinCode(testData.anyType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class AnyTypeRecord : Record {
			    @Field
			    val genericData: Any = mapOf()

			    @Field
			    val optionalGenericData: Any? = null
			  }"
			`);
		});
	});

	describe("Array types", () => {
		it("should handle string array", () => {
			const result = generateKotlinCode(testData.stringArray, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class StringArrayRecord : Record {
			    @Field
			    val tags: List<String> = listOf()

			    @Field
			    val optionalTags: List<String>? = null
			  }"
			`);
		});

		it("should handle number array", () => {
			const result = generateKotlinCode(testData.numberArray, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class NumberArrayRecord : Record {
			    @Field
			    val scores: List<Double> = listOf()

			    @Field
			    val optionalScores: List<Double>? = null
			  }"
			`);
		});

		it("should handle boolean array", () => {
			const result = generateKotlinCode(testData.booleanArray, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class BooleanArrayRecord : Record {
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
			const result = generateKotlinCode(testData.stringMap, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class StringMapRecord : Record {
			    @Field
			    val metadata: Map<String, String> = mapOf()

			    @Field
			    val optionalMetadata: Map<String, String>? = null
			  }"
			`);
		});

		it("should handle Record<string, any>", () => {
			const result = generateKotlinCode(testData.anyMap, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class AnyMapRecord : Record {
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
			const result = generateKotlinCode(testData.enumType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Status(val value: String) : Enumerable {
			    pending("pending"),
			    active("active")
			  }"
			`);
		});

		it("should handle numeric enum", () => {
			const result = generateKotlinCode(testData.numericEnumType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Direction(val value: Int) : Enumerable {
			    UP(0),
			    DOWN(1)
			  }

			  enum class Status(val value: Int) : Enumerable {
			    pending(1),
			    active(2)
			  }"
			`);
		});

		it("should handle string enum within record", () => {
			const result = generateKotlinCode(testData.nestedStringEnum, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Status(val value: String) : Enumerable {
			    pending("PENDING"),
			    active("ACTIVE")
			  }

			  class EnumRecord : Record {
			    @Field
			    val status: Status = Status.pending

			    @Field
			    val priority: Status? = null
			  }"
			`);
		});

		it("should handle numeric enum within record", () => {
			const result = generateKotlinCode(testData.nestedNumericEnum, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Direction(val value: Int) : Enumerable {
			    UP(0),
			    DOWN(1)
			  }

			  class EnumRecord : Record {
			    @Field
			    val direction: Direction = Direction.UP

			    @Field
			    val optionalDirection: Direction? = null
			  }"
			`);
		});
	});

	describe("Union types", () => {
		it("should treat null/undefined unions as optional of base type", () => {
			const result = generateKotlinCode(testData.optionalUnion, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class OptionalUnionRecord : Record {
			    @Field
			    val description: String? = null

			    @Field
			    val maybeCount: Double? = null
			  }"
			`);
		});

		it("should create enum from string literal union alias", () => {
			const result = generateKotlinCode(testData.unionAliasString, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Status(val value: String) : Enumerable {
			    pending("pending"),
			    active("active")
			  }

			  class AliasUnionRecord : Record {
			    @Field
			    val status: Status = Status.pending

			    @Field
			    val optionalStatus: Status? = null
			  }"
			`);
		});

		it("should create enum from numeric literal union alias", () => {
			const result = generateKotlinCode(testData.unionAliasNumeric, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Level(val value: Int) : Enumerable {
			    _1(1),
			    _2(2),
			    _3(3)
			  }

			  class PriorityRecord : Record {
			    @Field
			    val level: Level = Level._1

			    @Field
			    val optionalLevel: Level? = null
			  }"
			`);
		});

		it.todo(
			"should synthesize enum from string literal union and handle optional",
			() => {
				const result = generateKotlinCode(testData.literalStringUnion, config);
				expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Pending_Active_Union(val value: String) : Enumerable {
			    pending("pending"),
			    active("active")
			  }

			  class InlineUnionRecord : Record {
			    @Field
			    val status: Pending_Active_Union = Pending_Active_Union.pending

			    @Field
			    val optionalStatus: Pending_Active_Union? = null
			  }"
			`);
			},
		);

		it.todo(
			"should handle numeric literal unions with content-based naming",
			() => {
				const result = generateKotlinCode(testData.numericLiteralUnion, config);
				expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class 1_2_3_NumericUnion(val value: Int) : Enumerable {
			    _1(1),
			    _2(2),
			    _3(3)
			  }

			  class PriorityRecord : Record {
			    @Field
			    val level: 1_2_3_NumericUnion = 1_2_3_NumericUnion._1

			    @Field
			    val optionalLevel: 1_2_3_NumericUnion? = null
			  }"
			`);
			},
		);
	});

	describe("Binary data handling", () => {
		it("should handle Uint8Array", () => {
			const result = generateKotlinCode(testData.binaryDataRecord, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class BinaryDataRecord : Record {
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
			const result = generateKotlinCode(testData.nestedRecord, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class Address : Record {
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
			const result = generateKotlinCode(testData.nestedArrayRecord, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class Address : Record {
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

	describe("Object type alias", () => {
		it("should treat object type alias like interface", () => {
			const config = { kotlin: { packageName: "expo.modules.testmodule" } };
			const result = generateKotlinCode(testData.objectTypeAlias, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class UserProfile : Record {
			    @Field
			    val email: String = ""

			    @Field
			    val age: Double = 0.0
			  }

			  class User : Record {
			    @Field
			    val profile: UserProfile = UserProfile()

			    @Field
			    val optionalProfile: UserProfile? = null
			  }"
			`);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty TypeScript code", () => {
			const result = generateKotlinCode("", config);
			expect(result).toBe("");
		});

		it("should handle interface with no properties", () => {
			const result = generateKotlinCode(testData.emptyRecord, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  class EmptyRecord : Record {
			  }"
			`);
		});

		it("should throw error for unsupported types", () => {
			expect(() =>
				generateKotlinCode(testData.unsupportedType, config),
			).toThrow("Unsupported TypeScript type: never");
		});

		it("should reorder declarations when interface references another defined later", () => {
			const result = generateKotlinCode(testData.sortingDeclarations, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  enum class Status(val value: String) : Enumerable {
			    ACTIVE("active"),
			    INACTIVE("inactive")
			  }

			  class UserProfile : Record {
			    @Field
			    val email: String = ""

			    @Field
			    val age: Double = 0.0
			  }

			  class User : Record {
			    @Field
			    val profile: UserProfile = UserProfile()

			    @Field
			    val status: Status = Status.ACTIVE
			  }"
			`);
		});

		it("should detect circular dependencies", () => {
			expect(() =>
				generateKotlinCode(testData.circularDependency, config),
			).toThrow("Circular dependency detected involving A");
		});

		it("should throw error for duplicate declarations", () => {
			expect(() =>
				generateKotlinCode(testData.duplicateDeclarations, config),
			).toThrow("Duplicate declaration found: User");
		});
	});
});
