# Expo Native CodeGen

A Node.js library and CLI tool for generating Expo Native code from TypeScript definitions.

## Problem

When creating Expo Native Modules, developers must manually write:
1. TypeScript interfaces (for JS side)
2. Swift Record classes (for iOS)
3. Kotlin Record classes (for Android)

This is repetitive, error-prone, and time-consuming work.

## Solution

This library generates Swift and Kotlin Record classes from TypeScript interfaces automatically.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Build the project:
```bash
bun run build:all
```

## Usage

### As a Library

```typescript
import { generateSwiftRecords, generateKotlinRecords } from 'expo-native-codegen';

const typescriptCode = `
export interface GeneratedRecord {
  propertyName: string;
  optionalProperty?: string;
}
`;

// Generate Swift Records
const swiftCode = generateSwiftCode(typescriptCode);
console.log(swiftCode);
// Output:
// // Generated Swift Records
// // TODO: Parse TypeScript interfaces and generate Swift Records
// public struct GeneratedRecord: Record {
//   @Field
//   var propertyName: String = "default"
//   
//   @Field
//   var optionalProperty: String? = nil
// }

// Generate Kotlin Records  
const kotlinCode = generateKotlinCode(typescriptCode);
console.log(kotlinCode);
// Output:
// // Generated Kotlin Records
// // TODO: Parse TypeScript interfaces and generate Kotlin Records
// class GeneratedRecord : Record {
//   @Field
//   val propertyName: String = "default"
//   
//   @Field
//   val optionalProperty: String? = null
// }
```

### As a CLI

```bash
# Print hello world
bun run dist/cli.js
```

## Development

```bash
# Run tests
bun test

# Development mode (watch for changes)
bun run dev

# Build library and CLI
bun run build:all
```

## Project Structure

```
src/
├── index.ts          # Library entry point
├── cli.ts           # CLI entry point
└── index.test.ts    # Tests
``` 