import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getUserExamplePath } from "../fixtures/index";
import { generateCode } from "./cli";

const TEST_DIR = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"test-output",
);

const FIXTURES_DIR = getUserExamplePath();

const EXPECTED_KOTLIN_RESULT = await fs.readFile(
	path.join(FIXTURES_DIR, "expected", "expected-kotlin.kt"),
	"utf-8",
);
const EXPECTED_SWIFT_RESULT = await fs.readFile(
	path.join(FIXTURES_DIR, "expected", "expected-swift.swift"),
	"utf-8",
);

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

		// Copy fixtures to test directory
		await fs.cp(path.join(FIXTURES_DIR, "src"), path.join(TEST_DIR, "src"), {
			recursive: true,
		});
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
			inputPath: path.join(TEST_DIR, "src", "results.ts"),
			outputPath: path.join(TEST_DIR, "output"),
			configPath: path.join(TEST_DIR, "src", "config.json"),
		});

		const kotlinContent = await fs.readFile(
			path.join(TEST_DIR, "output", "kotlin", "Results.kt"),
			"utf-8",
		);

		expect(kotlinContent).toBe(EXPECTED_KOTLIN_RESULT);

		const swiftContent = await fs.readFile(
			path.join(TEST_DIR, "output", "swift", "Results.swift"),
			"utf-8",
		);
		expect(swiftContent).toBe(EXPECTED_SWIFT_RESULT);
	});

	it("should generate only Kotlin code when specified", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "src", "results.ts"),
			outputPath: path.join(TEST_DIR, "output"),
			configPath: path.join(TEST_DIR, "src", "config.json"),
			languages: ["kotlin"],
		});

		expect(await doesFileExist(path.join(TEST_DIR, "output", "swift"))).toBe(
			false,
		);

		const kotlinContent = await fs.readFile(
			path.join(TEST_DIR, "output", "kotlin", "Results.kt"),
			"utf-8",
		);
		expect(kotlinContent).toBe(EXPECTED_KOTLIN_RESULT);
	});

	it("should generate only Swift code when specified", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "src", "results.ts"),
			outputPath: path.join(TEST_DIR, "output"),
			configPath: path.join(TEST_DIR, "src", "config.json"),
			languages: ["swift"],
		});

		expect(await doesFileExist(path.join(TEST_DIR, "output", "kotlin"))).toBe(
			false,
		);

		const swiftContent = await fs.readFile(
			path.join(TEST_DIR, "output", "swift", "Results.swift"),
			"utf-8",
		);
		expect(swiftContent).toBe(EXPECTED_SWIFT_RESULT);
	});

	it("should fail with invalid config file", async () => {
		await fs.writeFile(
			path.join(TEST_DIR, "invalid-config.json"),
			JSON.stringify({ kotlin: {} }),
		);
		expect(
			generateCode({
				inputPath: path.join(TEST_DIR, "src", "results.ts"),
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
				configPath: path.join(TEST_DIR, "src", "config.json"),
			}),
		).rejects.toThrow("Input file not found");
	});

	it("should fail with nonexistent config file", () => {
		expect(
			generateCode({
				inputPath: path.join(TEST_DIR, "src", "results.ts"),
				outputPath: path.join(TEST_DIR, "output"),
				configPath: path.join(TEST_DIR, "nonexistent.json"),
			}),
		).rejects.toThrow("ENOENT");
	});

	it("should create output directories if they don't exist", async () => {
		await generateCode({
			inputPath: path.join(TEST_DIR, "src", "results.ts"),
			outputPath: path.join(TEST_DIR, "deeply", "nested", "output"),
			configPath: path.join(TEST_DIR, "src", "config.json"),
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
					"Results.kt",
				),
			),
		).toBe(true);

		const kotlinContent = await fs.readFile(
			path.join(TEST_DIR, "deeply", "nested", "output", "kotlin", "Results.kt"),
			"utf-8",
		);
		expect(kotlinContent).toBe(EXPECTED_KOTLIN_RESULT);
	});
});
