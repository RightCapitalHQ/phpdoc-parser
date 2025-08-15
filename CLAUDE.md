# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm test` - Run tests using Vitest
- `pnpm run build` - Build the TypeScript project
- `pnpm run clean` - Clean build artifacts
- `pnpm run eslint` - Run ESLint linting
- `pnpm run eslint:fix` - Run ESLint with auto-fix

### Package Management
- Uses pnpm as package manager (required, enforced by preinstall hook)
- `pnpm install` - Install dependencies

## Architecture

This is a TypeScript implementation of PHPDoc parser inspired by PHPStan's phpdoc-parser, focusing on parsing PHPDoc comments into an Abstract Syntax Tree (AST).

### Core Components

**Lexical Analysis (`src/phpdoc-parser/lexer/`)**
- `lexer.ts` - Tokenizes PHPDoc strings using regex patterns
- Handles 20+ token types (identifiers, types, operators, brackets, etc.)

**Parsing (`src/phpdoc-parser/parser/`)**
- `php-doc-parser.ts` - Main parser that converts tokens to AST nodes
- `type-parser.ts` - Handles type parsing (generics, unions, intersections)
- `const-expr-parser.ts` - Parses constant expressions
- `token-iterator.ts` - Token stream management with savepoint/rollback
- `string-unescaper.ts` - String literal processing

**AST Nodes (`src/phpdoc-parser/ast/`)**
- Base interfaces: `node.ts`, `base-node.ts`
- **php-doc/**: PHPDoc-specific nodes (tags, text, parameters, etc.)
- **type/**: Type system nodes (unions, intersections, generics, arrays)
- **const-expr/**: Constant expression nodes (strings, numbers, arrays)

**Printing (`src/phpdoc-parser/printer/`)**
- `printer.ts` - Converts AST back to formatted PHPDoc
- `differ.ts` - Format-preserving printing with diff tracking
- Supports both clean formatting and original format preservation

**Transpilation (`src/phpdoc-parser/transpiler/`)**
- `php-doc-to-typescript-type-transpiler.ts` - Converts PHPDoc types to TypeScript

### Key Patterns

- **Three-phase processing**: Lexing → Parsing → AST manipulation
- **Visitor pattern**: `node-traverser.ts` and `cloning-visitor.ts` for AST transformation
- **Attribute system**: Nodes can store metadata (line numbers, indexes) for format preservation
- **Error handling**: Invalid syntax produces `InvalidTagValueNode` or `InvalidTypeNode` rather than throwing
- **Format preservation**: Printer can maintain original formatting using token metadata

### Supported PHPDoc Features

- Standard tags: `@param`, `@return`, `@var`, `@throws`, `@deprecated`, etc.
- Advanced types: Generics, union/intersection types, conditional types, array shapes
- Template types and type aliases
- PHPStan/Psalm extensions
- Assertion tags for static analysis

## Project Structure

- `src/index.ts` - Main entry point exporting all public APIs
- `tests/` - Test files organized by component (lexer, parser, printer, transpiler)
- TypeScript build configuration in `tsconfig.build.json`