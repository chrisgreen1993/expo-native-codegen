/**
 * Main library entry point
 */

export function generateSwiftRecords(_typescriptCode: string): string {
	// TODO: Implement Swift Record generation
	// This stub will make tests fail, driving TDD implementation
	return `// STUB: NOT IMPLEMENTED YET
// This should fail all tests until properly implemented
public struct StubRecord: Record {
	@Field
	var notImplemented: String = "stub"
}`;
}

export function generateKotlinRecords(_typescriptCode: string): string {
	// TODO: Implement Kotlin Record generation
	// This stub will make tests fail, driving TDD implementation
	return `// STUB: NOT IMPLEMENTED YET
// This should fail all tests until properly implemented
class StubRecord : Record {
	@Field
	val notImplemented: String = "stub"
}`;
}

export default {
	generateSwiftRecords,
	generateKotlinRecords,
};
