import { describe, expect, it } from "bun:test";
import { generateSwiftRecords, generateKotlinRecords } from "./index";

describe("Code generation functions", () => {
	const sampleTypeScript = `
export interface GeneratedRecord {
  propertyName: string;
  optionalProperty?: string;
}
`;

	it("should generate Swift Records", () => {
		const result = generateSwiftRecords(sampleTypeScript);
		expect(result).toMatchSnapshot();
	});

	it("should generate Kotlin Records", () => {
		const result = generateKotlinRecords(sampleTypeScript);
		expect(result).toMatchSnapshot();
	});

	it("should handle empty TypeScript code", () => {
		const swiftResult = generateSwiftRecords("");
		const kotlinResult = generateKotlinRecords("");

		expect(swiftResult).toMatchSnapshot();
		expect(kotlinResult).toMatchSnapshot();
	});
});
