import { describe, expect, it } from "bun:test";
import { greet, hello } from "./index";

describe("Library functions", () => {
	it("should return hello message", () => {
		const result = hello();
		expect(result).toBe("Hello from expo-record-codegen library!");
	});

	it("should greet with name", () => {
		const result = greet("World");
		expect(result).toBe("Hello, World! Welcome to expo-record-codegen.");
	});

	it("should greet with different names", () => {
		const result = greet("Alice");
		expect(result).toBe("Hello, Alice! Welcome to expo-record-codegen.");
	});
});
