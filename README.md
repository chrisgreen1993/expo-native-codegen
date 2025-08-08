# Expo Record CodeGen

A Node.js library and CLI tool built with Bun.

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
import { hello, greet } from 'expo-record-codegen';

console.log(hello()); // "Hello from expo-record-codegen library!"
console.log(greet("World")); // "Hello, World! Welcome to expo-record-codegen."
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