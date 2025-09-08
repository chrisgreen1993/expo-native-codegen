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

			  data class StringRecord(
			    @Field
			    val name: String = "",

			    @Field
			    val optionalName: String? = null
			  ) : Record"
			`);
		});

		it("should handle number type", () => {
			const result = generateKotlinCode(testData.numberType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class NumberRecord(
			    @Field
			    val age: Double = 0.0,

			    @Field
			    val optionalAge: Double? = null
			  ) : Record"
			`);
		});

		it("should handle boolean type", () => {
			const result = generateKotlinCode(testData.booleanType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class BooleanRecord(
			    @Field
			    val isActive: Boolean = false,

			    @Field
			    val optionalIsActive: Boolean? = null
			  ) : Record"
			`);
		});

		it("should handle any type", () => {
			const result = generateKotlinCode(testData.anyType, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class AnyTypeRecord(
			    @Field
			    val genericData: Any = mapOf(),

			    @Field
			    val optionalGenericData: Any? = null
			  ) : Record"
			`);
		});
	});

	describe("Array types", () => {
		it("should handle string array", () => {
			const result = generateKotlinCode(testData.stringArray, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class StringArrayRecord(
			    @Field
			    val tags: List<String> = listOf(),

			    @Field
			    val optionalTags: List<String>? = null
			  ) : Record"
			`);
		});

		it("should handle number array", () => {
			const result = generateKotlinCode(testData.numberArray, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class NumberArrayRecord(
			    @Field
			    val scores: List<Double> = listOf(),

			    @Field
			    val optionalScores: List<Double>? = null
			  ) : Record"
			`);
		});

		it("should handle boolean array", () => {
			const result = generateKotlinCode(testData.booleanArray, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class BooleanArrayRecord(
			    @Field
			    val flags: List<Boolean> = listOf(),

			    @Field
			    val optionalFlags: List<Boolean>? = null
			  ) : Record"
			`);
		});
	});

	describe("Map/Object types", () => {
		it("should handle Record<string, string>", () => {
			const result = generateKotlinCode(testData.stringMap, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class StringMapRecord(
			    @Field
			    val metadata: Map<String, String> = mapOf(),

			    @Field
			    val optionalMetadata: Map<String, String>? = null
			  ) : Record"
			`);
		});

		it("should handle Record<string, any>", () => {
			const result = generateKotlinCode(testData.anyMap, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class AnyMapRecord(
			    @Field
			    val config: Map<String, Any> = mapOf(),

			    @Field
			    val optionalConfig: Map<String, Any>? = null
			  ) : Record"
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

			  data class EnumRecord(
			    @Field
			    val status: Status = Status.pending,

			    @Field
			    val priority: Status? = null
			  ) : Record"
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

			  data class EnumRecord(
			    @Field
			    val direction: Direction = Direction.UP,

			    @Field
			    val optionalDirection: Direction? = null
			  ) : Record"
			`);
		});
	});

	describe("Union types", () => {
		it("should treat null/undefined unions as optional of base type", () => {
			const result = generateKotlinCode(testData.optionalUnion, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class OptionalUnionRecord(
			    @Field
			    val description: String? = null,

			    @Field
			    val maybeCount: Double? = null
			  ) : Record"
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

			  data class AliasUnionRecord(
			    @Field
			    val status: Status = Status.pending,

			    @Field
			    val optionalStatus: Status? = null
			  ) : Record"
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

			  data class PriorityRecord(
			    @Field
			    val level: Level = Level._1,

			    @Field
			    val optionalLevel: Level? = null
			  ) : Record"
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

			  data class InlineUnionRecord(
			    @Field
			    val status: Pending_Active_Union = Pending_Active_Union.pending,

			    @Field
			    val optionalStatus: Pending_Active_Union? = null
			  ) : Record"
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

			  data class PriorityRecord(
			    @Field
			    val level: 1_2_3_NumericUnion = 1_2_3_NumericUnion._1,

			    @Field
			    val optionalLevel: 1_2_3_NumericUnion? = null
			  ) : Record"
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

			  data class BinaryDataRecord(
			    @Field
			    val data: ByteArray = ByteArray(0),

			    @Field
			    val optionalData: ByteArray? = null
			  ) : Record"
			`);
		});
	});

	describe("Nested records", () => {
		it("should handle nested interface", () => {
			const result = generateKotlinCode(testData.nestedRecord, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class Address(
			    @Field
			    val street: String = "",

			    @Field
			    val city: String = ""
			  ) : Record

			  data class NestedRecord(
			    @Field
			    val address: Address = Address(),

			    @Field
			    val billingAddress: Address? = null
			  ) : Record"
			`);
		});

		it("should handle nested interface array", () => {
			const result = generateKotlinCode(testData.nestedArrayRecord, config);
			expect(result).toMatchInlineSnapshot(`
			  "package expo.modules.testmodule

			  import expo.modules.kotlin.*

			  data class Address(
			    @Field
			    val street: String = "",

			    @Field
			    val city: String = ""
			  ) : Record

			  data class NestedArrayRecord(
			    @Field
			    val addresses: List<Address> = listOf(),

			    @Field
			    val optionalAddresses: List<Address>? = null
			  ) : Record"
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

			  data class UserProfile(
			    @Field
			    val email: String = "",

			    @Field
			    val age: Double = 0.0
			  ) : Record

			  data class User(
			    @Field
			    val profile: UserProfile = UserProfile(),

			    @Field
			    val optionalProfile: UserProfile? = null
			  ) : Record"
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

			  data class EmptyRecord : Record"
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

			  data class UserProfile(
			    @Field
			    val email: String = "",

			    @Field
			    val age: Double = 0.0
			  ) : Record

			  data class User(
			    @Field
			    val profile: UserProfile = UserProfile(),

			    @Field
			    val status: Status = Status.ACTIVE
			  ) : Record"
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
