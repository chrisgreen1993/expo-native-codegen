# 🚧 (WIP - Pre-release) Expo Native CodeGen

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

### CLI

Build the CLI:
```bash
bun run build:cli
```

Run:
```bash
# TypeScript file (automatically bundles dependencies)
node dist/cli.js \
  --input path/to/types.ts \
  --output ./generated \
  --config codegen.json

# Short flags
node dist/cli.js -i path/to/types.ts -o ./generated -c codegen.json

# Specify languages (default: kotlin, swift)
node dist/cli.js -i path/to/types.ts -o ./generated -c codegen.json -l kotlin
node dist/cli.js -i path/to/types.ts -o ./generated -c codegen.json -l swift
```

Outputs:
- Kotlin: `generated/kotlin/<PascalCaseOfInput>.kt`
- Swift: `generated/swift/<PascalCaseOfInput>.swift`

Config (`codegen.json`):
```json
{
  "kotlin": {
    "packageName": "expo.modules.mymodule"
  }
}
```

Input example (`types.ts`):
```ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

### Library

```ts
import { generateSwiftCode, generateKotlinCode } from "expo-native-codegen";

const ts = `export interface ValidationResult { isValid: boolean; errors: string[] }`;

const swift = generateSwiftCode(ts);
const kotlin = generateKotlinCode(ts, { kotlin: { packageName: "expo.modules.mymodule" } });
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