# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expo Native CodeGen is a TypeScript-based code generation tool that transforms TypeScript interface definitions into native Swift and Kotlin Record classes for Expo Native Modules. The tool eliminates manual writing of equivalent types across platforms.

## Core Architecture

The codebase follows a pipeline architecture:

1. **Input Processing** (`src/cli.ts`): Bundles TypeScript files and dependencies using `dts-bundle-generator`
2. **AST Parsing** (`src/index.ts`): Uses `ts-morph` to extract interfaces, enums, and type aliases
3. **Intermediate Representation** (`src/ir-builder.ts`): Converts TypeScript AST to language-agnostic IR defined in `src/types.ts`
4. **Code Generation**: 
   - Swift: `src/swift-generator.ts`
   - Kotlin: `src/kotlin-generator.ts`

The IR system allows adding new target languages without re-parsing TypeScript.

## Development Commands

```bash
# Install dependencies
bun install

# Build library only
bun run build

# Build CLI only  
bun run build:cli

# Build both library and CLI
bun run build:all

# Run tests
bun test

# Run specific test file
bun test src/cli.test.ts

# Development mode (watch)
bun run dev

# Type checking
bun run type-check

# Linting and formatting (using Biome)
bun run lint
bun run lint:fix
bun run format
bun run format:fix
bun run check         # lint + format combined
bun run check:fix     # lint + format fix combined
```

## CLI Usage

After building with `bun run build:cli`:

```bash
# Basic usage
node dist/cli.js -i path/to/types.ts -o ./generated -c config.json

# Specify target languages
node dist/cli.js -i path/to/types.ts -o ./generated -c config.json -l kotlin
node dist/cli.js -i path/to/types.ts -o ./generated -c config.json -l swift

# Custom tsconfig
node dist/cli.js -i path/to/types.ts -o ./generated -c config.json -t custom-tsconfig.json
```

## Configuration

Config file format (`config.json`):
```json
{
  "kotlin": {
    "packageName": "expo.modules.mymodule"
  }
}
```

## Testing

- Test files: `src/*.test.ts` using Bun's built-in test runner
- Test fixtures: `fixtures/user-example/` with expected outputs
- Tests verify end-to-end CLI functionality and individual generator outputs
- TypeScript config excludes test fixtures from type checking

## Key Dependencies

- `ts-morph`: TypeScript AST manipulation and parsing
- `dts-bundle-generator`: Bundles TypeScript files with dependencies  
- `yargs`: CLI argument parsing
- `@biomejs/biome`: Linting and formatting (configured for tabs, double quotes)

## Documentation

- `docs/project.md`: Project goals and problem statement
- `docs/types.md`: TypeScript to Swift/Kotlin type mapping reference

## Code Style

- Uses Biome for formatting (tabs, double quotes)
- Strict TypeScript configuration
- Module system: ESNext with "Preserve" mode