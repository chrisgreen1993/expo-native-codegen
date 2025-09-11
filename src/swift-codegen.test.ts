import { describe, expect, it } from "bun:test";
import { createCodegenFixtures } from "../fixtures/index";
import { generateSwiftCode } from "./index";

describe("Swift Code Generation", () => {
	const testData = createCodegenFixtures();

	describe("Primitive types", () => {
		it("should handle string type", () => {
			const result = generateSwiftCode(testData.stringType);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct StringRecord: Record {
			    @Field
			    var name: String = ""

			    @Field
			    var optionalName: String? = nil
			  }"
			`);
		});

		it("should handle number type", () => {
			const result = generateSwiftCode(testData.numberType);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct NumberRecord: Record {
			    @Field
			    var age: Double = 0.0

			    @Field
			    var optionalAge: Double? = nil
			  }"
			`);
		});

		it("should handle boolean type", () => {
			const result = generateSwiftCode(testData.booleanType);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct BooleanRecord: Record {
			    @Field
			    var isActive: Bool = false

			    @Field
			    var optionalIsActive: Bool? = nil
			  }"
			`);
		});

		it("should handle any type", () => {
			const result = generateSwiftCode(testData.anyType);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct AnyTypeRecord: Record {
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
			const result = generateSwiftCode(testData.stringArray);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct StringArrayRecord: Record {
			    @Field
			    var tags: [String] = []

			    @Field
			    var optionalTags: [String]? = nil
			  }"
			`);
		});

		it("should handle number array", () => {
			const result = generateSwiftCode(testData.numberArray);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct NumberArrayRecord: Record {
			    @Field
			    var scores: [Double] = []

			    @Field
			    var optionalScores: [Double]? = nil
			  }"
			`);
		});

		it("should handle boolean array", () => {
			const result = generateSwiftCode(testData.booleanArray);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct BooleanArrayRecord: Record {
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
			const result = generateSwiftCode(testData.stringMap);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct StringMapRecord: Record {
			    @Field
			    var metadata: [String: String] = [:]

			    @Field
			    var optionalMetadata: [String: String]? = nil
			  }"
			`);
		});

		it("should handle Record<string, any>", () => {
			const result = generateSwiftCode(testData.anyMap);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct AnyMapRecord: Record {
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
			const result = generateSwiftCode(testData.enumType);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  enum Status: String, Enumerable {
			    case pending = "pending"
			    case active = "active"
			  }"
			`);
		});

		it("should handle numeric enum", () => {
			const result = generateSwiftCode(testData.numericEnumType);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  enum Direction: Int, Enumerable {
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
			const result = generateSwiftCode(testData.nestedStringEnum);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  enum Status: String, Enumerable {
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
			const result = generateSwiftCode(testData.nestedNumericEnum);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  enum Direction: Int, Enumerable {
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
			const result = generateSwiftCode(testData.optionalUnion);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct OptionalUnionRecord: Record {
			    @Field
			    var description: String? = nil

			    @Field
			    var maybeCount: Double? = nil
			  }"
			`);
		});

		it("should create enum from string literal union alias", () => {
			const result = generateSwiftCode(testData.unionAliasString);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  enum Status: String, Enumerable {
			    case pending = "pending"
			    case active = "active"
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
			const result = generateSwiftCode(testData.unionAliasNumeric);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  enum Level: Int, Enumerable {
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
				const result = generateSwiftCode(testData.literalStringUnion);
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
				const result = generateSwiftCode(testData.numericLiteralUnion);
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
			const result = generateSwiftCode(testData.binaryDataRecord);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct BinaryDataRecord: Record {
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
			const result = generateSwiftCode(testData.nestedRecord);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct Address: Record {
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
			const result = generateSwiftCode(testData.nestedArrayRecord);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct Address: Record {
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

	describe("Object type alias", () => {
		it("should treat object type alias like interface", () => {
			const result = generateSwiftCode(testData.objectTypeAlias);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct UserProfile: Record {
			    @Field
			    var email: String = ""

			    @Field
			    var age: Double = 0.0
			  }

			  public struct User: Record {
			    @Field
			    var profile: UserProfile = UserProfile()

			    @Field
			    var optionalProfile: UserProfile? = nil
			  }"
			`);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty TypeScript code", () => {
			const result = generateSwiftCode("");
			expect(result).toBe("");
		});

		it("should handle interface with no properties", () => {
			const result = generateSwiftCode(testData.emptyRecord);
			expect(result).toMatchInlineSnapshot(`
			  "import ExpoModulesCore

			  public struct EmptyRecord: Record {}"
			`);
		});

		it("should throw error for unsupported types", () => {
			expect(() => generateSwiftCode(testData.unsupportedType)).toThrow(
				"Unsupported TypeScript type: never",
			);
		});

		it("should reorder declarations when interface references another defined later", () => {
			const result = generateSwiftCode(testData.sortingDeclarations);
			expect(result).toMatchInlineSnapshot(`
				"import ExpoModulesCore

				enum Status: String, Enumerable {
				  case ACTIVE = "active"
				  case INACTIVE = "inactive"
				}

				public struct UserProfile: Record {
				  @Field
				  var email: String = ""

				  @Field
				  var age: Double = 0.0
				}

				public struct User: Record {
				  @Field
				  var profile: UserProfile = UserProfile()

				  @Field
				  var status: Status = .ACTIVE
				}"
			`);
		});

		it("should detect circular dependencies", () => {
			expect(() => generateSwiftCode(testData.circularDependency)).toThrow(
				"Circular dependency detected involving A",
			);
		});

		it("should throw error for duplicate declarations", () => {
			// This might happen if the same interface is declared multiple times
			expect(() => generateSwiftCode(testData.duplicateDeclarations)).toThrow(
				"Duplicate declaration found: User",
			);
		});
	});
});
