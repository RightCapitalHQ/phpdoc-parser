# How to Use the PHPDoc Parser Transpiler

This document provides a guide on how to use the PHPDoc Parser Transpiler to convert PHPDoc comments into TypeScript type definitions. We'll go through a example demonstrating how to set up and execute the transpilation process.

## Setting Up the Environment

Before you begin, ensure you have a TypeScript project setup where you can run the example code. Your project should include the necessary files and dependencies related to the PHPDoc Parser.

## Example Code Overview

The example provided demonstrates how to parse a PHPDoc comment, extract node information, and transpile it into a TypeScript node structure. The main steps are as follows:

1. **Tokenization**: Convert a PHPDoc comment string into tokens.
2. **Parsing**: Transform the tokens into an Abstract Syntax Tree (AST) representing the PHPDoc structure.
3. **Transpilation**: Convert the PHPDoc AST nodes into TypeScript type nodes.
4. **Rendering**: Convert the TypeScript nodes into strings representing TypeScript type definitions.

## Step 1: Import Necessary Classes and Types

```TypeScript
import { renderTsNodeToString } from './helpers';
import { PhpDocTypeNodeToTypescriptTypeNodeTranspiler } from './php-doc-to-typescript-type-transpiler';
import type { ParamTagValueNode, PropertyTagValueNode, ReturnTagValueNode } from '../ast/php-doc';
import { Lexer, ConstExprParser, PhpDocParser, TokenIterator, TypeParser } from '../lexer/parser';
```

## Step 2: Define a Custom Transpiler Class

```TypeScript
class ExtendedTranspiler extends PhpDocTypeNodeToTypescriptTypeNodeTranspiler {
  public customProperty: string = '';

  constructor(public resolver: NameNodePathResolver<ExtendedTranspiler>) {
    super((nodeParts: string[]) => resolver.call(this, nodeParts) as {
      path: string;
      name: string;
      isTypeOnly: boolean;
    });
  }
}
```

By extending the `PhpDocTypeNodeToTypescriptTypeNodeTranspiler` class to create a custom `ExtendedTranspiler` class, you gain the flexibility to add custom properties like `customProperty`. This allows you to tailor the transpiler's behavior to your project's needs. For example, the `customProperty` property can be used to determine how names are transformed or resolved within the `NameNodePathResolver`, catering to specific naming conventions with ease.

## Step 3: Parse the PHPDoc Comment

```TypeScript
const getPropertyTagValueNodesFromComment = (commentText: string) => {
  // Initialize the parser objects.
  const lexer = new Lexer();
  const constExprParser = new ConstExprParser();
  const typeParser = new TypeParser(constExprParser);
  const phpDocParser = new PhpDocParser(typeParser, constExprParser);

  // Tokenize and parse the PHPDoc comment to create the AST.
  const tokens = new TokenIterator(lexer.tokenize(commentText));
  const astRootNode = phpDocParser.parse(tokens); // Produces a PHPDocNode

  // Extract property, return, or parameter nodes from the AST.
  const propertyTagValueNodes = astRootNode
    .getTags()
    .map((node) => node.value)

  return propertyTagValueNodes;
};
```

## Step 4: Transpile PHPDoc Nodes to TypeScript and Render

```TypeScript
const commentText = `/**
* @property-read  array|null  $person
*/`;

// Parse the PHPDoc comment text to get node structures.
const transpiledCommentNodes = getPropertyTagValueNodesFromComment(commentText);

// Define a resolver function for path resolving in the transpiler.
const nameNodePathResolver: NameNodePathResolver<ExtendedTranspiler> =
  function (this: ExtendedTranspiler, nodeParts: string[]) {
    console.log(nodeParts, this.customProperty);

    return {
      name: '',
      path: '',
      isTypeOnly: false,
    };
  };

// Map through the nodes, transpile each, and render to TypeScript type strings.
transpiledCommentNodes.map((node) => {
  const transpiler = new ExtendedTranspiler(nameNodePathResolver);
  transpiler.customProperty = 'this is a custom property'; // Set your configurations
  transpiler.beforeTranspile(); // Initialize transpilation state(reset the state of importDeclarations)
  const transpiledNode = transpiler.transpile(node.type); // Transpile the node

  // Render the TypeScript node to a string
  return renderTsNodeToString(transpiledNode);
});
```

The `nameNodePathResolver` function is defined as a `NameNodePathResolver` for the `ExtendedTranspiler` class. Within this function, by using the `this` keyword typed as `ExtendedTranspiler`, it gains direct access to properties and methods of `ExtendedTranspiler`, including the custom property `customProperty`.

## Conclusion

This guide presented a simplistic way to bridge PHPDoc comments and TypeScript type definitions using a transpiler. By parsing, transpiling, and rendering, you can automate the conversion of types from PHP to TypeScript, enhancing interoperability between the two languages in your project.
