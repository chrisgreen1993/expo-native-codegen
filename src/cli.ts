#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";
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
	// Read and validate input file
	const inputContent = await fs.readFile(inputPath, "utf-8");
	const configContent = await fs.readFile(configPath, "utf-8");

	// Parse config
	const configObj = JSON.parse(configContent) as CodegenConfig;

	if (!configObj.kotlin?.packageName) {
		throw new Error("Config must specify kotlin.packageName");
	}

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
				description: "Input TypeScript file path",
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
