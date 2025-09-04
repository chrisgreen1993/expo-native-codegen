import { Project } from "ts-morph";
import { buildIntermediateRepresentation } from "./ir-builder";
import { generateSwiftCode as generateSwiftFromIR } from "./swift-generator";
import type { TSDeclaration } from "./types";

export function getDeclarations(typescriptCode: string): TSDeclaration[] {
	if (!typescriptCode.trim()) return [];

	const project = new Project({
		useInMemoryFileSystem: true,
		compilerOptions: { strictNullChecks: true },
	});
	const sourceFile = project.createSourceFile("input.ts", typescriptCode);

	return [
		...sourceFile.getInterfaces(),
		...sourceFile.getEnums(),
		...sourceFile.getTypeAliases(),
	];
}

export function generateSwiftCode(typescriptCode: string): string {
	const declarations = getDeclarations(typescriptCode);
	const irDeclarations = buildIntermediateRepresentation(declarations);
	return generateSwiftFromIR(irDeclarations);
}

export function generateKotlinCode(_typescriptCode: string): string {
	return "";
}

export default {
	generateSwiftCode,
	generateKotlinCode,
};
