#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";
import { generateDtsBundle } from "dts-bundle-generator";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateKotlinCode, generateSwiftCode } from "./index";
import type { CodegenConfig } from "./types";

type Language = "kotlin" | "swift";
const SUPPORTED_LANGUAGES: Language[] = ["kotlin", "swift"] as const;

function getPascalCaseFilename(inputPath: string): string {
	// Get the filename without extension
	const basename = path.basename(inputPath, path.extname(inputPath));

	// Convert kebab/snake case to Pascal case
	return basename
		.split(/[-_]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

// Given a TypeScript file, bundle the file and dependencies into a single .d.ts file
async function bundleTypeScriptFiles(inputPath: string): Promise<string> {
	try {
		// Check if input file exists
		await fs.access(inputPath);

		// This will use the tsconfig.json in the same directory as the input file by default
		const [bundledContent] = generateDtsBundle([
			{ filePath: inputPath, output: { noBanner: true } },
		]);

		return bundledContent ?? "";
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			throw new Error(`Input file not found: ${inputPath}`);
		}
		throw new Error(
			`Failed to bundle TypeScript files: ${error instanceof Error ? error.message : error}`,
		);
	}
}

export interface CodegenOptions {
	inputPath: string;
	outputPath: string;
	configPath: string;
	languages?: Language[];
}

export async function generateCode({
	inputPath,
	outputPath,
	configPath,
	languages = SUPPORTED_LANGUAGES,
}: CodegenOptions): Promise<void> {
	// Read config
	const configContent = await fs.readFile(configPath, "utf-8");
	const configObj = JSON.parse(configContent) as CodegenConfig;

	if (!configObj.kotlin?.packageName) {
		throw new Error("Config must specify kotlin.packageName");
	}

	// Bundle TypeScript files into a single .d.ts
	const inputContent = await bundleTypeScriptFiles(inputPath);
	// biome-ignore lint/suspicious/noConsole: CLI output
	console.log(`Bundled TypeScript files from: ${inputPath}`);

	// Get the base filename in PascalCase
	const baseName = getPascalCaseFilename(inputPath);

	// Generate code for each requested language
	for (const lang of languages) {
		const outputDir = path.join(outputPath, lang);
		await fs.mkdir(outputDir, { recursive: true });

		const outputFile = path.join(
			outputDir,
			`${baseName}.${lang === "kotlin" ? "kt" : "swift"}`,
		);

		const generatedCode =
			lang === "kotlin"
				? generateKotlinCode(inputContent, configObj)
				: generateSwiftCode(inputContent, configObj);

		await fs.writeFile(outputFile, generatedCode, "utf-8");
		// biome-ignore lint/suspicious/noConsole: CLI output
		console.log(`Generated ${lang} code at: ${outputFile}`);
	}
}

async function main() {
	try {
		const argv = await yargs(hideBin(process.argv))
			.option("input", {
				alias: "i",
				type: "string",
				description: "Input TypeScript file path (.ts)",
				demandOption: true,
			})
			.option("output", {
				alias: "o",
				type: "string",
				description: "Output directory path",
				demandOption: true,
			})
			.option("config", {
				alias: "c",
				type: "string",
				description: "Config file path (JSON)",
				demandOption: true,
			})
			.option("lang", {
				alias: "l",
				type: "array",
				choices: SUPPORTED_LANGUAGES,
				description: "Languages to generate",
				default: SUPPORTED_LANGUAGES,
			})
			.help()
			.alias("help", "h").argv;

		await generateCode({
			inputPath: argv.input,
			outputPath: argv.output,
			configPath: argv.config,
			languages: argv.lang,
		});
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: CLI error output
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}
