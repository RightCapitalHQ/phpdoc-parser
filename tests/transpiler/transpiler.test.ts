import { factory } from 'typescript';
import { expect, describe, it } from 'vitest';
import {
  Lexer,
  type NameNodePathResolver,
  PhpDocTypeNodeToTypescriptTypeNodeTranspiler,
  TokenIterator,
  ConstExprParser,
  TypeParser,
  PhpDocParser,
  renderTsNodeToString,
  isPropertyTagValueNode,
} from '../../src';

class ExtendedTranspiler extends PhpDocTypeNodeToTypescriptTypeNodeTranspiler {
  public customProperty: string = '';

  constructor(public resolver: NameNodePathResolver<ExtendedTranspiler>) {
    super(
      (nodeParts: string[]) =>
        resolver.call(this, nodeParts) as {
          path: string;
          name: string;
          isTypeOnly: boolean;
        },
    );
  }
}

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
    .filter(isPropertyTagValueNode);

  return propertyTagValueNodes;
};

describe('TranspilerTest', () => {
  // Define a resolver function for path resolving in the transpiler.
  const nameNodePathResolver: NameNodePathResolver<ExtendedTranspiler> =
    // eslint-disable-next-line func-names
    function (this: ExtendedTranspiler, nodeParts: string[]) {
      return {
        name: nodeParts.at(-1),
        path: '',
        isTypeOnly: false,
      };
    };

  const commentText = `/**
    * @property-read  array|null  $person
    * @property       int         $id
    */`;

  // Parse the PHPDoc comment text to get node structures.
  const transpiledCommentNodes =
    getPropertyTagValueNodesFromComment(commentText);

  const transpiledTypeDefinitionTestCases = [
    'person: any | null;',
    'id: number;',
  ];

  transpiledCommentNodes.forEach((transpiledCommentNode, index) => {
    const transpiler = new ExtendedTranspiler(nameNodePathResolver);
    transpiler.customProperty = 'this is a custom property'; // Set your configurations
    transpiler.beforeTranspile(); // Initialize transpilation state(reset the state of importDeclarations)
    const transpiledTypeNode = transpiler.transpile(transpiledCommentNode.type); // Transpile the node

    const typescriptNode = factory.createPropertySignature(
      undefined,
      transpiledCommentNode.propertyName.replace('$', ''),
      undefined,
      transpiledTypeNode,
    );

    // Render the TypeScript node to a string
    const propertyDefinitionText = renderTsNodeToString(typescriptNode);

    it(propertyDefinitionText, () => {
      expect(propertyDefinitionText).toEqual(
        transpiledTypeDefinitionTestCases[index],
      );
    });
  });
});
