# PHPDoc parser TypeScript version

Next-gen PHPDoc parser with support for intersection types and generics(TypeScript version)

## What's that

This parser is inspired by the PHPStan's phpdoc-parser library: https://github.com/phpstan/phpdoc-parser

this libraray `@rightcapital/phpdoc-parser` represents PHPDocs with an AST (Abstract Syntax Tree). It supports parsing and modifying PHPDocs by using `TypeScript`/`Javascript`.

For the complete list of supported PHPDoc features check out PHPStan documentation.

- [PHPDoc Basics](https://phpstan.org/writing-php-code/phpdocs-basics) (list of PHPDoc tags)
- [PHPDoc Types](https://phpstan.org/writing-php-code/phpdoc-types) (list of PHPDoc types)

## Installation

```bash
# pnpm
pnpm add @rightcapital/phpdoc-parser
# yarn
yarn add @rightcapital/phpdoc-parser
# npm
npm install --save @rightcapital/phpdoc-parser
```

## Basic usage

```typescript
import {
  ConstExprParser,
  Lexer,
  PhpDocParser,
  TokenIterator,
  TypeParser,
} from '@rightcapital/phpdoc-parser';

// basic setup

const lexer = new Lexer();
const constExprParser = new ConstExprParser();
const typeParser = new TypeParser(constExprParser);
const phpDocParser = new PhpDocParser(typeParser, constExprParser);

// parsing and reading a PHPDoc string

const tokens = new TokenIterator(lexer.tokenize('/** @param Lorem $a */'));
const phpDocNode = phpDocParser.parse(tokens); // PhpDocNode
const paramTags = phpDocNode.getParamTagValues(); // ParamTagValueNode[]
console.log(paramTags[0].parameterName); // '$a'
console.log(paramTags[0].type); // IdentifierTypeNode { attributes: {}, name: 'Lorem' }
```

# Welcome to contribute

We are stilling waiting for someones to contribute, especially for the following features.

- Printer module
- Doctrine Annotations support
- More tests
- More docs
- A script to monitor [upstream](https://github.com/phpstan/phpdoc-parser) updates and notify the author to catch up.

## How did we create the initial version of this project.

We created most of our code by using ChatGPT as a tool to transform most code from https://github.com/phpstan/phpdoc-parser to TypeScript version.

Our PHP API haven't used Doctrine, so Doctrine support are removed.

## License

MIT License © 2023-Present