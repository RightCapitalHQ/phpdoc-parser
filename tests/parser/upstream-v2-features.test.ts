import { describe, it, expect } from 'vitest';
import {
  Comment,
  ConstExprParser,
  ConstExprStringNode,
  GenericTypeNode,
  IdentifierTypeNode,
  Lexer,
  ParserConfig,
  PhpDocParser,
  TokenIterator,
  TypeParser,
  UnionTypeNode,
} from '../../src';

describe('Upstream v2.0+ Features', () => {
  describe('ParserConfig', () => {
    it('should have default false values', () => {
      const config = new ParserConfig();
      expect(config.useLinesAttributes).toBe(false);
      expect(config.useIndexAttributes).toBe(false);
      expect(config.useCommentsAttributes).toBe(false);
    });

    it('should accept configuration options', () => {
      const config = new ParserConfig({
        lines: true,
        indexes: true,
        comments: true,
      });
      expect(config.useLinesAttributes).toBe(true);
      expect(config.useIndexAttributes).toBe(true);
      expect(config.useCommentsAttributes).toBe(true);
    });

    it('should handle partial configuration', () => {
      const config = new ParserConfig({ lines: true });
      expect(config.useLinesAttributes).toBe(true);
      expect(config.useIndexAttributes).toBe(false);
      expect(config.useCommentsAttributes).toBe(false);
    });
  });

  describe('Comment class', () => {
    it('should create comment with defaults', () => {
      const comment = new Comment('// hello');
      expect(comment.text).toBe('// hello');
      expect(comment.startLine).toBe(-1);
      expect(comment.startIndex).toBe(-1);
    });

    it('should create comment with position', () => {
      const comment = new Comment('// hello', 5, 10);
      expect(comment.text).toBe('// hello');
      expect(comment.startLine).toBe(5);
      expect(comment.startIndex).toBe(10);
    });

    it('should return reformatted text', () => {
      const comment = new Comment('  // hello  ');
      expect(comment.getReformattedText()).toBe('// hello');
    });
  });

  describe('ConstExprStringNode merge (v2.0)', () => {
    it('should have SINGLE_QUOTED and DOUBLE_QUOTED constants', () => {
      expect(ConstExprStringNode.SINGLE_QUOTED).toBe(1);
      expect(ConstExprStringNode.DOUBLE_QUOTED).toBe(2);
    });

    it('should create single-quoted string node', () => {
      const node = new ConstExprStringNode(
        'hello',
        ConstExprStringNode.SINGLE_QUOTED,
      );
      expect(node.value).toBe('hello');
      expect(node.quoteType).toBe(ConstExprStringNode.SINGLE_QUOTED);
      expect(node.toString()).toBe("'hello'");
    });

    it('should create double-quoted string node', () => {
      const node = new ConstExprStringNode(
        'hello',
        ConstExprStringNode.DOUBLE_QUOTED,
      );
      expect(node.value).toBe('hello');
      expect(node.quoteType).toBe(ConstExprStringNode.DOUBLE_QUOTED);
      expect(node.toString()).toBe('"hello"');
    });

    it('should escape single quotes in single-quoted strings', () => {
      const node = new ConstExprStringNode(
        "it's",
        ConstExprStringNode.SINGLE_QUOTED,
      );
      expect(node.toString()).toBe("'it\\'s'");
    });

    it('should escape double quotes in double-quoted strings', () => {
      const node = new ConstExprStringNode(
        'say "hi"',
        ConstExprStringNode.DOUBLE_QUOTED,
      );
      expect(node.toString()).toBe('"say \\"hi\\""');
    });

    it('should have nodeType ConstExprStringNode', () => {
      const node = new ConstExprStringNode(
        'test',
        ConstExprStringNode.SINGLE_QUOTED,
      );
      expect(node.getNodeType()).toBe('ConstExprStringNode');
    });

    it('should parse single-quoted string in const expr', () => {
      const lexer = new Lexer();
      const parser = new ConstExprParser();
      const tokens = new TokenIterator(lexer.tokenize("'hello'"));
      const node = parser.parse(tokens);
      expect(node).toBeInstanceOf(ConstExprStringNode);
      const strNode = node as ConstExprStringNode;
      expect(strNode.value).toBe('hello');
      expect(strNode.quoteType).toBe(ConstExprStringNode.SINGLE_QUOTED);
    });

    it('should parse double-quoted string in const expr', () => {
      const lexer = new Lexer();
      const parser = new ConstExprParser();
      const tokens = new TokenIterator(lexer.tokenize('"world"'));
      const node = parser.parse(tokens);
      expect(node).toBeInstanceOf(ConstExprStringNode);
      const strNode = node as ConstExprStringNode;
      expect(strNode.value).toBe('world');
      expect(strNode.quoteType).toBe(ConstExprStringNode.DOUBLE_QUOTED);
    });
  });

  describe('TOKEN_COMMENT in Lexer (v2.1)', () => {
    it('should have TOKEN_COMMENT token type', () => {
      expect(Lexer.TOKEN_COMMENT).toBe('TOKEN_COMMENT');
    });

    it('should tokenize inline comments', () => {
      const lexer = new Lexer();
      const tokens = lexer.tokenize('/** int // a comment\n */');
      const commentToken = tokens.find(
        (t) => t[Lexer.TYPE_OFFSET] === Lexer.TOKEN_COMMENT,
      );
      expect(commentToken).toBeDefined();
      expect(commentToken![Lexer.VALUE_OFFSET]).toBe('// a comment');
    });

    it('should have TOKEN_COMMENT in TOKEN_LABELS', () => {
      expect(Lexer.TOKEN_LABELS[Lexer.TOKEN_COMMENT]).toBe('//');
    });
  });

  describe('skipNewLineTokensAndConsumeComments (v2.1)', () => {
    it('should handle comments in multi-line generic types', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const input = `/** @var array<
        int, // the key type
        string // the value type
      > */`;
      const tokens = new TokenIterator(lexer.tokenize(input));
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);
      const result = phpDocParser.parse(tokens);
      const tag = result.getTags()[0];
      expect(tag).toBeDefined();
      const varTag = tag.value;
      expect(varTag.toString()).toContain('array<int, string>');
    });

    it('should handle comments between union type members', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const input = `/** @var int
      // a comment between union members
      | string */`;
      const tokens = new TokenIterator(lexer.tokenize(input));
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);
      const result = phpDocParser.parse(tokens);
      const tag = result.getTags()[0];
      expect(tag).toBeDefined();
      const varTag = tag.value;
      const type = (varTag as { type: UnionTypeNode }).type;
      expect(type).toBeInstanceOf(UnionTypeNode);
    });

    it('should handle comments in array shapes', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const input = `/** @var array{
        foo: int, // the foo field
        bar: string, // the bar field
      } */`;
      const tokens = new TokenIterator(lexer.tokenize(input));
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);
      const result = phpDocParser.parse(tokens);
      const tag = result.getTags()[0];
      expect(tag).toBeDefined();
    });
  });

  describe('TokenIterator comment handling', () => {
    it('should flush comments from token iterator', () => {
      const lexer = new Lexer();
      const tokens = new TokenIterator(lexer.tokenize('/** int */'));
      const comments = tokens.flushComments();
      expect(comments).toEqual([]);
    });

    it('should preserve comments through savepoint rollback', () => {
      const lexer = new Lexer();
      const tokens = new TokenIterator(lexer.tokenize('/** int */'));
      tokens.pushSavePoint();
      const flushed = tokens.flushComments();
      expect(flushed).toEqual([]);
      tokens.rollback();
    });
  });

  describe('Multi-line type parsing with comments', () => {
    it('should parse generic type spanning multiple lines with comments', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      // Test parsing a type directly
      const tokens = new TokenIterator(
        lexer.tokenize(
          '/** @return Foo<int, // key type\nstring> */',
        ),
      );
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);
      const result = phpDocParser.parse(tokens);
      const tag = result.getTags()[0];
      expect(tag).toBeDefined();
      const returnTag = tag.value as { type: GenericTypeNode };
      expect(returnTag.type).toBeInstanceOf(GenericTypeNode);
      expect(returnTag.type.genericTypes).toHaveLength(2);
    });
  });
});
