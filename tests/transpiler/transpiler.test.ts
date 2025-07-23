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
  constructor(public resolver: NameNodePathResolver<ExtendedTranspiler>) {
    super(
      (nodeParts: string[]) =>
        resolver.call(this, nodeParts) as {
          path: string;
          importName: string;
          typeIdentifiers: string[];
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

// Define a resolver function for path resolving in the transpiler.
const nameNodePathResolver: NameNodePathResolver<ExtendedTranspiler> =
  // eslint-disable-next-line func-names
  function (this: ExtendedTranspiler, nodeParts: string[]) {
    const lastPart = nodeParts.at(-1);

    return {
      path: '',
      isTypeOnly: false,
      importName: lastPart,
      typeIdentifiers: [lastPart],
    };
  };

const testCommentTextTranspile = (
  commentText: string,
  transpiledTypeDefinitionTestCases: string[],
) => {
  const transpiledCommentNodes =
    getPropertyTagValueNodesFromComment(commentText);

  transpiledCommentNodes.forEach((transpiledCommentNode, index) => {
    const transpiler = new ExtendedTranspiler(nameNodePathResolver);
    transpiler.beforeTranspile();
    const transpiledTypeNode = transpiler.transpile(transpiledCommentNode.type);

    const typescriptNode = factory.createPropertySignature(
      undefined,
      transpiledCommentNode.propertyName.replace('$', ''),
      undefined,
      transpiledTypeNode,
    );

    const propertyDefinitionText = renderTsNodeToString(typescriptNode);

    it(propertyDefinitionText, () => {
      expect(propertyDefinitionText).toEqual(
        transpiledTypeDefinitionTestCases[index],
      );
    });
  });
};

describe('Transpiler', () => {
  describe('UnionTypeNode', () => {
    const commentText = `/**
    * @property   string | int | bool       $three_types
    * @property   int|null                  $id
    */`;

    const transpiledTypeDefinitionTestCases = [
      'three_types: string | number | boolean;',
      'id: number | null;',
    ];

    testCommentTextTranspile(commentText, transpiledTypeDefinitionTestCases);
  });

  describe('ArrayTypeNode', () => {
    const commentText = `/**
    * @property   string[]    $names
    */`;

    const transpiledTypeDefinitionTestCases = ['names: string[];'];

    testCommentTextTranspile(commentText, transpiledTypeDefinitionTestCases);
  });

  describe('ObjectShapeNode and ArrayShapeNode', () => {
    const commentText = `/**
    * @property   object{'foo': int}    $object_shape
    * @property   array{'foo': int, "bar"?: string, 0: boolean}    $array_shape
    */`;

    const transpiledTypeDefinitionTestCases = [
      `object_shape: {
    foo: number;
};`,
      `array_shape: {
    foo: number;
    bar?: string;
    0: boolean;
};`,
    ];

    testCommentTextTranspile(commentText, transpiledTypeDefinitionTestCases);
  });

  describe('GenericTypeNode', () => {
    const commentText = `/**
    * @property   array<Type>   $type_1
    * @property   non-empty-array<Type>   $type_2
    * @property   list<Type>   $type_3
    * @property   non-empty-list<Type>   $type_4
    * @property   \\Illuminate\\Database\\Eloquent\\Collection<Type>   $type_5
    * @property   array<int, Type>   $type_6
    * @property   non-empty-array<integer, Type>   $type_7
    * @property   list<float, Type>   $type_8
    * @property   non-empty-list<double, Type>   $type_9
    * @property   \\Illuminate\\Database\\Eloquent\\Collection<int, Type>   $type_10
    * @property   array<string, Type>   $type_11
    * @property   non-empty-array<string, Type>   $type_12
    * @property   list<string, Type>   $type_13
    * @property   non-empty-list<string, Type>   $type_14
    * @property   \\Illuminate\\Database\\Eloquent\\Collection<string, Type>   $type_15
    */`;

    const transpiledTypeDefinitionTestCases = [
      `type_1: Type[];`,
      `type_2: Type[];`,
      `type_3: Type[];`,
      `type_4: Type[];`,
      `type_5: Type[];`,
      `type_6: Type[];`,
      `type_7: Type[];`,
      `type_8: Type[];`,
      `type_9: Type[];`,
      `type_10: Type[];`,
      `type_11: Record<string, Type>;`,
      `type_12: Record<string, Type>;`,
      `type_13: Record<string, Type>;`,
      `type_14: Record<string, Type>;`,
      `type_15: Record<string, Type>;`,
    ];

    testCommentTextTranspile(commentText, transpiledTypeDefinitionTestCases);
  });

  describe('IdentifierTypeNode', () => {
    const commentText = `/**
    * @property   bool      $boolean_type_1
    * @property   boolean   $boolean_type_2
    * @property   true      $boolean_type_3
    * @property   false     $boolean_type_4
    * @property   int       $number_type_1
    * @property   integer   $number_type_2
    * @property   float      $number_type_3
    * @property   double    $number_type_4
    * @property   string    $string_type
    * @property   array-key $array_key_type
    * @property   scalar    $scalar_type
    * @property   mixed     $mixed_type
    * @property   void      $void_type
    * @property   null      $null_type
    * @property   Expr      $expr_type
    * @property   Node\\Arg $arg_type_1
    * @property   \\Ast\\Node\\Arg  $arg_type_2
    */`;

    const transpiledTypeDefinitionTestCases = [
      'boolean_type_1: boolean;',
      'boolean_type_2: boolean;',
      'boolean_type_3: boolean;',
      'boolean_type_4: boolean;',
      'number_type_1: number;',
      'number_type_2: number;',
      'number_type_3: number;',
      'number_type_4: number;',
      'string_type: string;',
      'array_key_type: string | number;',
      'scalar_type: string | number | boolean;',
      'mixed_type: any;',
      'void_type: void;',
      'null_type: null;',
      'expr_type: Expr;',
      'arg_type_1: Arg;',
      'arg_type_2: Arg;',
    ];

    testCommentTextTranspile(commentText, transpiledTypeDefinitionTestCases);
  });
});
