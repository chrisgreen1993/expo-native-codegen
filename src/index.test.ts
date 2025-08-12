import { describe, expect, it } from "bun:test";
import { generateKotlinRecords, generateSwiftRecords } from "./index";

// Helper function to create test data
function createTestData() {
	return {
		stringType: `
export interface StringRecord {
  name: string;
}`,
		numberType: `
export interface NumberRecord {
  age: number;
  height: number;
}`,
		booleanType: `
export interface BooleanRecord {
  isActive: boolean;
}`,
		anyType: `
export interface AnyTypeRecord {
  genericData: any;
  optionalGenericData?: any;
}`,
		unsupportedType: `
export interface UnsupportedTypeRecord {
  data: Date;
  buffer: Buffer;
}`,
		stringArray: `
export interface StringArrayRecord {
  tags: string[];
}`,
		numberArray: `
export interface NumberArrayRecord {
  scores: number[];
}`,
		booleanArray: `
export interface BooleanArrayRecord {
  flags: boolean[];
}`,
		stringMap: `
export interface StringMapRecord {
  metadata: Record<string, string>;
}`,
		anyMap: `
export interface AnyMapRecord {
  config: Record<string, any>;
}`,
		enumType: `
export enum Status {
  PENDING = "pending",
  ACTIVE = "active"
}

export interface EnumRecord {
  status: Status;
}`,
		optionalString: `
export interface OptionalRecord {
  name: string;
  description?: string;
}`,
		optionalNumber: `
export interface OptionalNumberRecord {
  age: number;
  height?: number;
}`,
		dateType: `
export interface DateRecord {
  createdAt: string; // ISO 8601 date string
  lastLogin?: string; // Optional ISO 8601 date string
}`,
		nestedRecord: `
export interface Address {
  street: string;
  city: string;
}

export interface NestedRecord {
  name: string;
  address: Address;
}`,
		nestedArrayRecord: `
export interface Address {
  street: string;
  city: string;
}

export interface NestedArrayRecord {
  name: string;
  addresses: Address[];
}`,
		binaryDataRecord: `
export interface BinaryDataRecord {
  name: string;
  data: UInt8Array;
  optionalData?: UInt8Array;
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
			expect(result).toMatchSnapshot();
		});

		it("should handle number type", () => {
			const result = generateSwiftRecords(testData.numberType);
			expect(result).toMatchSnapshot();
		});

		it("should handle boolean type", () => {
			const result = generateSwiftRecords(testData.booleanType);
			expect(result).toMatchSnapshot();
		});

		it("should handle any type", () => {
			const result = generateSwiftRecords(testData.anyType);
			expect(result).toMatchSnapshot();
		});
	});

	describe.todo("Array types", () => {
		it("should handle string array", () => {
			const result = generateSwiftRecords(testData.stringArray);
			expect(result).toMatchSnapshot();
		});

		it("should handle number array", () => {
			const result = generateSwiftRecords(testData.numberArray);
			expect(result).toMatchSnapshot();
		});

		it("should handle boolean array", () => {
			const result = generateSwiftRecords(testData.booleanArray);
			expect(result).toMatchSnapshot();
		});
	});

	describe.todo("Map/Object types", () => {
		it("should handle Record<string, string>", () => {
			const result = generateSwiftRecords(testData.stringMap);
			expect(result).toMatchSnapshot();
		});

		it("should handle Record<string, any>", () => {
			const result = generateSwiftRecords(testData.anyMap);
			expect(result).toMatchSnapshot();
		});
	});

	describe.todo("Enum types", () => {
		it("should handle string enum", () => {
			const result = generateSwiftRecords(testData.enumType);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Optional types", () => {
		it("should handle optional string", () => {
			const result = generateSwiftRecords(testData.optionalString);
			expect(result).toMatchSnapshot();
		});

		it("should handle optional number", () => {
			const result = generateSwiftRecords(testData.optionalNumber);
			expect(result).toMatchSnapshot();
		});
	});

	describe.todo("Date handling", () => {
		it("should handle date as string", () => {
			const result = generateSwiftRecords(testData.dateType);
			expect(result).toMatchSnapshot();
		});
	});

	describe.todo("Binary data handling", () => {
		it("should handle UInt8Array", () => {
			const result = generateSwiftRecords(testData.binaryDataRecord);
			expect(result).toMatchSnapshot();
		});
	});

	describe.todo("Nested records", () => {
		it("should handle nested interface", () => {
			const result = generateSwiftRecords(testData.nestedRecord);
			expect(result).toMatchSnapshot();
		});

		it("should handle nested interface array", () => {
			const result = generateSwiftRecords(testData.nestedArrayRecord);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Edge cases", () => {
		it("should handle empty TypeScript code", () => {
			const result = generateSwiftRecords("");
			expect(result).toBe("");
		});

		it("should handle interface with no properties", () => {
			const result = generateSwiftRecords(testData.emptyRecord);
			expect(result).toMatchSnapshot();
		});

		it("should throw error for unsupported types", () => {
			expect(() => generateSwiftRecords(testData.unsupportedType)).toThrow(
				"Unsupported TypeScript type: Date",
			);
		});
	});
});

describe.todo("Kotlin Record Generation", () => {
	const testData = createTestData();

	describe("Primitive types", () => {
		it("should handle string type", () => {
			const result = generateKotlinRecords(testData.stringType);
			expect(result).toMatchSnapshot();
		});

		it("should handle number type", () => {
			const result = generateKotlinRecords(testData.numberType);
			expect(result).toMatchSnapshot();
		});

		it("should handle boolean type", () => {
			const result = generateKotlinRecords(testData.booleanType);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Array types", () => {
		it("should handle string array", () => {
			const result = generateKotlinRecords(testData.stringArray);
			expect(result).toMatchSnapshot();
		});

		it("should handle number array", () => {
			const result = generateKotlinRecords(testData.numberArray);
			expect(result).toMatchSnapshot();
		});

		it("should handle boolean array", () => {
			const result = generateKotlinRecords(testData.booleanArray);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Map/Object types", () => {
		it("should handle Record<string, string>", () => {
			const result = generateKotlinRecords(testData.stringMap);
			expect(result).toMatchSnapshot();
		});

		it("should handle Record<string, any>", () => {
			const result = generateKotlinRecords(testData.anyMap);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Enum types", () => {
		it("should handle string enum", () => {
			const result = generateKotlinRecords(testData.enumType);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Optional types", () => {
		it("should handle optional string", () => {
			const result = generateKotlinRecords(testData.optionalString);
			expect(result).toMatchSnapshot();
		});

		it("should handle optional number", () => {
			const result = generateKotlinRecords(testData.optionalNumber);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Date handling", () => {
		it("should handle date as string", () => {
			const result = generateKotlinRecords(testData.dateType);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Binary data handling", () => {
		it("should handle UInt8Array", () => {
			const result = generateKotlinRecords(testData.binaryDataRecord);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Nested records", () => {
		it("should handle nested interface", () => {
			const result = generateKotlinRecords(testData.nestedRecord);
			expect(result).toMatchSnapshot();
		});

		it("should handle nested interface array", () => {
			const result = generateKotlinRecords(testData.nestedArrayRecord);
			expect(result).toMatchSnapshot();
		});
	});

	describe("Edge cases", () => {
		it("should handle empty TypeScript code", () => {
			const result = generateKotlinRecords("");
			expect(result).toBe("");
		});

		it("should handle interface with no properties", () => {
			const result = generateKotlinRecords(testData.emptyRecord);
			expect(result).toMatchSnapshot();
		});
	});
});
