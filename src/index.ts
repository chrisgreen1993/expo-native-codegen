/**
 * Main library entry point
 */

export function hello(): string {
	return "Hello from expo-record-codegen library!";
}

export function greet(name: string): string {
	return `Hello, ${name}! Welcome to expo-record-codegen.`;
}

// Default export
export default {
	hello,
	greet,
};
