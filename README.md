# PHPDoc parser TypeScript version

<!-- Badges area start -->

[![made by RightCapital](https://img.shields.io/badge/made_by-RightCapital-5070e6)](https://rightcapital.com)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/RightCapitalHQ/phpdoc-parser/ci.yaml)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![RightCapital frontend style guide](https://img.shields.io/badge/code_style-RightCapital-5c4c64?labelColor=f0ede8)](https://github.com/RightCapitalHQ/frontend-style-guide)

<!-- Badges area end -->

Next-gen PHPDoc parser with support for intersection types and generics(TypeScript version)

## What's that

This parser is inspired by the PHPStan's phpdoc-parser library: https://github.com/phpstan/phpdoc-parser

this libraray `@rightcapital/phpdoc-parser` represents PHPDocs with an AST (Abstract Syntax Tree). It supports parsing and modifying PHPDocs by using `TypeScript`/`JavaScript`.

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

## Format-preserving printer

This component can be used to modify the AST and print it again as close as possible to the original.

It's heavily inspired by format-preserving printer component in nikic/PHP-Parser.

```typescript
import {
  CloningVisitor,
  ConstExprParser,
  IdentifierTypeNode,
  Lexer,
  NodeTraverser,
  PhpDocNode,
  PhpDocParser,
  TokenIterator,
  TypeParser,
  Printer,
} from '@rightcapital/phpdoc-parser';

const usedAttributes = { lines: true, indexes: true };

const lexer = new Lexer();
const constExprParser = new ConstExprParser(true, true, usedAttributes);
const typeParser = new TypeParser(constExprParser, true, usedAttributes);
const phpDocParser = new PhpDocParser(
  typeParser,
  constExprParser,
  true,
  true,
  usedAttributes,
);

const tokens = new TokenIterator(lexer.tokenize('/** @param Lorem $a */'));
const phpDocNode = phpDocParser.parse(tokens); // PhpDocNode

const cloningTraverser = new NodeTraverser([new CloningVisitor()]);

const [newPhpDocNode] = cloningTraverser.traverse([phpDocNode]) as [PhpDocNode];

// change something in newPhpDocNode
newPhpDocNode.getParamTagValues()[0].type = new IdentifierTypeNode('Ipsum');

// print changed PHPDoc
const printer = new Printer();
const newPhpDoc = printer.print(newPhpDocNode);
console.log(newPhpDoc);
// --- result ---
// /**
//  * @param Ipsum $a
//  */

const newPhpDocWithFormatPreserving = printer.printFormatPreserving(
  newPhpDocNode,
  phpDocNode,
  tokens,
);
console.log(newPhpDocWithFormatPreserving); // '/** @param Ipsum $a */'
```

## Welcome to contribute

We are stilling waiting for someones to contribute, especially for the following features.

- Doctrine Annotations support
- More tests
- More docs
- A script to monitor [upstream](https://github.com/phpstan/phpdoc-parser) updates and notify the author to catch up.

Please check out our [Contribution guide](docs/CONTRIBUTING.md)

## How did we create the initial version of this project.

We created most of our code by using ChatGPT as a tool to transform most code from https://github.com/phpstan/phpdoc-parser to TypeScript version.

Our PHP API haven't used Doctrine, so Doctrine support are removed.

## License

MIT License © 2023-Present
