import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCode } from "./cli";

const TEST_DIR = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"test-output",
);

const EXPECTED_KOTLIN_VALIDATION_RESULT = `package expo.modules.test

import expo.modules.kotlin.*

data class ValidationResult(
  @Field
  val isValid: Boolean = false,

  @Field
  val errors: List<String> = listOf()
) : Record`;

const EXPECTED_SWIFT_VALIDATION_RESULT = `import ExpoModulesCore

public struct ValidationResult: Record {
  @Field
  var isValid: Bool = false

  @Field
  var errors: [String] = []
}`;

async function doesFileExist(path: string) {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}

describe("CLI", () => {
	beforeEach(async () => {
		// Silence console output during tests
		console.log = () => null;
		console.error = () => null;
		// Create test directory
		await fs.mkdir(TEST_DIR, { recursive: true });

		// Create test files
		const tsContent = `export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}`;
		const configContent = JSON.stringify({
			kotlin: {
				packageName: "expo.modules.test",
			},
		});

		await fs.writeFile(path.join(TEST_DIR, "validation-result.ts"), tsContent);
		await fs.writeFile(path.join(TEST_DIR, "config.json"), configContent);
	});

	afterEach(async () => {
		// Clean up test directory
		await fs.rm(TEST_DIR, { recursive: true, force: true });
		// Restore console
		console.log = global.console.log;
		console.error = global.console.error;
	});

	it("should generate both Kotlin and Swift code by default", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "validation-result.ts"),
			outputPath: path.join(TEST_DIR, "output"),
			configPath: path.join(TEST_DIR, "config.json"),
		});

		const kotlinContent = await fs.readFile(
			path.join(TEST_DIR, "output", "kotlin", "ValidationResult.kt"),
			"utf-8",
		);

		expect(kotlinContent).toBe(EXPECTED_KOTLIN_VALIDATION_RESULT);

		const swiftContent = await fs.readFile(
			path.join(TEST_DIR, "output", "swift", "ValidationResult.swift"),
			"utf-8",
		);
		expect(swiftContent).toBe(EXPECTED_SWIFT_VALIDATION_RESULT);
	});

	it("should generate only Kotlin code when specified", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "validation-result.ts"),
			outputPath: path.join(TEST_DIR, "output"),
			configPath: path.join(TEST_DIR, "config.json"),
			languages: ["kotlin"],
		});

		expect(await doesFileExist(path.join(TEST_DIR, "output", "swift"))).toBe(
			false,
		);

		const kotlinContent = await fs.readFile(
			path.join(TEST_DIR, "output", "kotlin", "ValidationResult.kt"),
			"utf-8",
		);
		expect(kotlinContent).toBe(EXPECTED_KOTLIN_VALIDATION_RESULT);
	});

	it("should generate only Swift code when specified", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "validation-result.ts"),
			outputPath: path.join(TEST_DIR, "output"),
			configPath: path.join(TEST_DIR, "config.json"),
			languages: ["swift"],
		});

		expect(await doesFileExist(path.join(TEST_DIR, "output", "kotlin"))).toBe(
			false,
		);

		const swiftContent = await fs.readFile(
			path.join(TEST_DIR, "output", "swift", "ValidationResult.swift"),
			"utf-8",
		);
		expect(swiftContent).toBe(EXPECTED_SWIFT_VALIDATION_RESULT);
	});

	it("should fail with invalid config file", async () => {
		await fs.writeFile(
			path.join(TEST_DIR, "invalid-config.json"),
			JSON.stringify({ kotlin: {} }),
		);
		expect(
			generateCode({
				inputPath: path.join(TEST_DIR, "validation-result.ts"),
				outputPath: path.join(TEST_DIR, "output"),
				configPath: path.join(TEST_DIR, "invalid-config.json"),
			}),
		).rejects.toThrow("Config must specify kotlin.packageName");
	});

	it("should fail with nonexistent input file", () => {
		expect(
			generateCode({
				inputPath: path.join(TEST_DIR, "nonexistent.ts"),
				outputPath: path.join(TEST_DIR, "output"),
				configPath: path.join(TEST_DIR, "config.json"),
			}),
		).rejects.toThrow("ENOENT");
	});

	it("should fail with nonexistent config file", () => {
		expect(
			generateCode({
				inputPath: path.join(TEST_DIR, "validation-result.ts"),
				outputPath: path.join(TEST_DIR, "output"),
				configPath: path.join(TEST_DIR, "nonexistent.json"),
			}),
		).rejects.toThrow("ENOENT");
	});

	it("should create output directories if they don't exist", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "validation-result.ts"),
			outputPath: path.join(TEST_DIR, "deeply", "nested", "output"),
			configPath: path.join(TEST_DIR, "config.json"),
			languages: ["kotlin"],
		});

		expect(
			await doesFileExist(
				path.join(
					TEST_DIR,
					"deeply",
					"nested",
					"output",
					"kotlin",
					"ValidationResult.kt",
				),
			),
		).toBe(true);

		const kotlinContent = await fs.readFile(
			path.join(
				TEST_DIR,
				"deeply",
				"nested",
				"output",
				"kotlin",
				"ValidationResult.kt",
			),
			"utf-8",
		);
		expect(kotlinContent).toBe(EXPECTED_KOTLIN_VALIDATION_RESULT);
	});
});
