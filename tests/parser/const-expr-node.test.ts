import { describe, it, beforeEach, expect } from 'vitest';
import {
  Attribute,
  type BaseNode,
  ConstExprArrayItemNode,
  ConstExprArrayNode,
  ConstExprFalseNode,
  ConstExprFloatNode,
  ConstExprIntegerNode,
  type ConstExprNode,
  ConstExprNullNode,
  ConstExprParser,
  ConstExprStringNode,
  ConstExprTrueNode,
  ConstFetchNode,
  Lexer,
  NodeTraverser,
  TokenIterator,
} from '../../src';
import { NodeCollectingVisitor } from '../../src/phpdoc-parser/parser/node-collecting-visitor';

type TestFixtureDataItem = [input: string, expected: ConstExprNode];

const trueNodeParseData = [
  // True
  ['true', new ConstExprTrueNode()],
  ['TRUE', new ConstExprTrueNode()],
  ['tRUe', new ConstExprTrueNode()],
] as TestFixtureDataItem[];

const falseNodeParseData = [
  // False
  ['false', new ConstExprFalseNode()],
  ['FALSE', new ConstExprFalseNode()],
  ['fALse', new ConstExprFalseNode()],
] as TestFixtureDataItem[];

const nullNodeParseData = [
  // Null
  ['null', new ConstExprNullNode()],
  ['NULL', new ConstExprNullNode()],
  ['nULl', new ConstExprNullNode()],
] as TestFixtureDataItem[];

const integerNodeParseData = [
  // Integer
  ['123', new ConstExprIntegerNode('123')],
  ['+123', new ConstExprIntegerNode('+123')],
  ['-123', new ConstExprIntegerNode('-123')],
  ['0b0110101', new ConstExprIntegerNode('0b0110101')],
  ['0o777', new ConstExprIntegerNode('0o777')],
  ['0x7Fb4', new ConstExprIntegerNode('0x7Fb4')],
  ['-0O777', new ConstExprIntegerNode('-0O777')],
  ['-0X7Fb4', new ConstExprIntegerNode('-0X7Fb4')],
  ['123_456', new ConstExprIntegerNode('123456')],
  ['0b01_01_01', new ConstExprIntegerNode('0b010101')],
  ['-0X7_Fb_4', new ConstExprIntegerNode('-0X7Fb4')],
  [
    '18_446_744_073_709_551_616',
    new ConstExprIntegerNode('18446744073709551616'),
  ],
] as TestFixtureDataItem[];

const floatNodeParseData = [
  // Float
  ['123.4', new ConstExprFloatNode('123.4')],
  ['.123', new ConstExprFloatNode('.123')],
  ['123.', new ConstExprFloatNode('123.')],
  ['123e4', new ConstExprFloatNode('123e4')],
  ['123E4', new ConstExprFloatNode('123E4')],
  ['12.3e4', new ConstExprFloatNode('12.3e4')],
  ['+123.5', new ConstExprFloatNode('+123.5')],
  ['-123.', new ConstExprFloatNode('-123.')],
  ['-123.4', new ConstExprFloatNode('-123.4')],
  ['-.123', new ConstExprFloatNode('-.123')],
  ['-123.', new ConstExprFloatNode('-123.')],
  ['-123e-4', new ConstExprFloatNode('-123e-4')],
  ['-12.3e-4', new ConstExprFloatNode('-12.3e-4')],
  ['-1_2.3_4e5_6', new ConstExprFloatNode('-12.34e56')],
  ['123.4e+8', new ConstExprFloatNode('123.4e+8')],
  ['.4e+8', new ConstExprFloatNode('.4e+8')],
  ['123E+80', new ConstExprFloatNode('123E+80')],
  ['8.2023437675747321', new ConstExprFloatNode('8.2023437675747321')],
  ['-0.0', new ConstExprFloatNode('-0.0')],
] as TestFixtureDataItem[];

const stringNodeParseData = [
  // String
  ['"foo"', new ConstExprStringNode('"foo"')],
  ['"Foo \\n\\"\\r Bar"', new ConstExprStringNode('"Foo \\n\\"\\r Bar"')],
  ["'bar'", new ConstExprStringNode("'bar'")],
  ["'Foo \\' Bar'", new ConstExprStringNode("'Foo \\' Bar'")],
] as TestFixtureDataItem[];

const arrayNodeParseData = [
  // Array
  ['[]', new ConstExprArrayNode([])],
  [
    '[123]',
    new ConstExprArrayNode([
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('123')),
    ]),
  ],
  [
    '[1, 2, 3]',
    new ConstExprArrayNode([
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('1')),
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('2')),
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('3')),
    ]),
  ],
  [
    '[1, 2, 3, ]',
    new ConstExprArrayNode([
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('1')),
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('2')),
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('3')),
    ]),
  ],
  [
    '[1 => 2]',
    new ConstExprArrayNode([
      new ConstExprArrayItemNode(
        new ConstExprIntegerNode('1'),
        new ConstExprIntegerNode('2'),
      ),
    ]),
  ],
  [
    '[1 => 2, 3]',
    new ConstExprArrayNode([
      new ConstExprArrayItemNode(
        new ConstExprIntegerNode('1'),
        new ConstExprIntegerNode('2'),
      ),
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('3')),
    ]),
  ],
  [
    '[1, [2, 3]]',
    new ConstExprArrayNode([
      new ConstExprArrayItemNode(null, new ConstExprIntegerNode('1')),
      new ConstExprArrayItemNode(
        null,
        new ConstExprArrayNode([
          new ConstExprArrayItemNode(null, new ConstExprIntegerNode('2')),
          new ConstExprArrayItemNode(null, new ConstExprIntegerNode('3')),
        ]),
      ),
    ]),
  ],
];

const fetchNodeParseData = [
  ['GLOBAL_CONSTANT', new ConstFetchNode('', 'GLOBAL_CONSTANT')],
  [
    'Foo\\Bar\\GLOBAL_CONSTANT',
    new ConstFetchNode('', 'Foo\\Bar\\GLOBAL_CONSTANT'),
  ],
  [
    'Foo\\Bar::CLASS_CONSTANT',
    new ConstFetchNode('Foo\\Bar', 'CLASS_CONSTANT'),
  ],
  ['self::CLASS_CONSTANT', new ConstFetchNode('self', 'CLASS_CONSTANT')],
] as TestFixtureDataItem[];

const withTrimStringsStringParseData = [
  ['"foo"', new ConstExprStringNode('foo')],
  ['"Foo \\n\\"\\r Bar"', new ConstExprStringNode('Foo \n"\r Bar')],
  ["'bar'", new ConstExprStringNode('bar')],
  ["'Foo \\' Bar'", new ConstExprStringNode("Foo ' Bar")],
  ['"\u{1f601}"', new ConstExprStringNode('\u{1f601}')],
  // ['"\u{ffffffff}"', new ConstExprStringNode('\u{fffd}')],
];

describe('ConstExprParser', () => {
  let lexer: Lexer;
  let parser: ConstExprParser;

  beforeEach(() => {
    lexer = new Lexer();
    parser = new ConstExprParser();
  });

  describe('Parse', () => {
    it.each([
      ...trueNodeParseData,
      ...falseNodeParseData,
      ...nullNodeParseData,
      ...integerNodeParseData,
      ...floatNodeParseData,
      ...stringNodeParseData,
      ...arrayNodeParseData,
      ...fetchNodeParseData,
    ] as TestFixtureDataItem[])(
      'should parse %s node',
      (input: string, expected: ConstExprNode) => {
        // tokenize
        const tokens = new TokenIterator(lexer.tokenize(input));
        // parse
        const node = parser.parse(tokens);
        // verify
        expect(node).toEqual(expected);
      },
    );
  });

  describe('Verify Attributes', () => {
    it.each([
      ...trueNodeParseData,
      ...falseNodeParseData,
      ...nullNodeParseData,
      ...integerNodeParseData,
      ...floatNodeParseData,
      ...stringNodeParseData,
      ...arrayNodeParseData,
      ...fetchNodeParseData,
      ...withTrimStringsStringParseData,
    ] as TestFixtureDataItem[])(
      'should has attributes for %s node',
      (input: string) => {
        // tokenize
        const tokens = new TokenIterator(lexer.tokenize(input));
        const visitor = new NodeCollectingVisitor();
        const traverser = new NodeTraverser([visitor]);

        parser = new ConstExprParser(true, true, {
          lines: true,
          indexes: true,
        });
        traverser.traverse([parser.parse(tokens)]);

        visitor.nodes.forEach((node) => {
          expect(
            (node as BaseNode).getAttribute(Attribute.START_LINE),
          ).not.toBeNull();

          expect(
            (node as BaseNode).getAttribute(Attribute.END_LINE),
          ).not.toBeNull();

          expect(
            (node as BaseNode).getAttribute(Attribute.START_INDEX),
          ).not.toBeNull();

          expect(
            (node as BaseNode).getAttribute(Attribute.END_INDEX),
          ).not.toBeNull();
        });
      },
    );
  });
});
