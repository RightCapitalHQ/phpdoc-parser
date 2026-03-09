import { describe, it, expect } from 'vitest';
import {
  ArrayShapeItemNode,
  ArrayShapeNode,
  ArrayShapeUnsealedTypeNode,
  CallableTypeNode,
  ConstExprParser,
  ConstFetchNode,
  IdentifierTypeNode,
  Lexer,
  ParamClosureThisTagValueNode,
  ParamImmediatelyInvokedCallableTagValueNode,
  ParamLaterInvokedCallableTagValueNode,
  PhpDocParser,
  PureUnlessCallableIsImpureTagValueNode,
  RequireExtendsTagValueNode,
  RequireImplementsTagValueNode,
  SealedTagValueNode,
  TemplateTagValueNode,
  TokenIterator,
  TypeParser,
  UnionTypeNode,
  IntersectionTypeNode,
} from '../../src';

describe('Upstream 2024 Features', () => {
  describe('Constant fetch in array shape keys', () => {
    it('should parse array shape with constant fetch key', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var array{MyClass::CONST: string} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      expect(arrayShape.items).toHaveLength(1);

      const item = arrayShape.items[0] as ArrayShapeItemNode;
      expect(item.keyName).toBeInstanceOf(ConstFetchNode);
      const constFetch = item.keyName as ConstFetchNode;
      expect(constFetch.className).toBe('MyClass');
      expect(constFetch.name).toBe('CONST');
    });

    it('should fallback to identifier if not a constant fetch', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var array{key: string} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      const item = arrayShape.items[0] as ArrayShapeItemNode;
      expect(item.keyName).toBeInstanceOf(IdentifierTypeNode);
    });
  });

  describe('@phpstan-sealed tag', () => {
    it('should parse @phpstan-sealed tag with type', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @phpstan-sealed ChildA|ChildB */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      expect(phpDoc.children).toHaveLength(1);

      const tag = phpDoc.children[0];
      expect(tag.toString()).toContain('@phpstan-sealed');
      // @ts-expect-error - accessing value property
      expect(tag.value).toBeInstanceOf(SealedTagValueNode);
      // @ts-expect-error - accessing value property
      const value = tag.value as SealedTagValueNode;
      expect(value.type).toBeInstanceOf(UnionTypeNode);
    });

    it('should parse @phpstan-sealed tag with type and description', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @phpstan-sealed ChildA This class is sealed */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as SealedTagValueNode;
      expect(value.type).toBeInstanceOf(IdentifierTypeNode);
      expect((value.type as IdentifierTypeNode).name).toBe('ChildA');
      expect(value.description).toBe('This class is sealed');
    });
  });

  describe('@psalm-inheritors tag', () => {
    it('should parse @psalm-inheritors tag with type', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @psalm-inheritors ChildA|ChildB */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      expect(phpDoc.children).toHaveLength(1);

      const tag = phpDoc.children[0];
      expect(tag.toString()).toContain('@psalm-inheritors');
      // @ts-expect-error - accessing value property
      expect(tag.value).toBeInstanceOf(SealedTagValueNode);
    });
  });

  describe('Template lower bounds', () => {
    it('should parse template with lower bound', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @template T super BaseClass */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as TemplateTagValueNode;

      expect(value.name).toBe('T');
      expect(value.lowerBound).toBeInstanceOf(IdentifierTypeNode);
      expect((value.lowerBound as IdentifierTypeNode).name).toBe('BaseClass');
    });

    it('should parse template with both upper and lower bounds', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @template T of UpperClass super LowerClass */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as TemplateTagValueNode;

      expect(value.name).toBe('T');
      expect(value.bound).toBeInstanceOf(IdentifierTypeNode);
      expect((value.bound as IdentifierTypeNode).name).toBe('UpperClass');
      expect(value.lowerBound).toBeInstanceOf(IdentifierTypeNode);
      expect((value.lowerBound as IdentifierTypeNode).name).toBe('LowerClass');
    });
  });

  describe('Multiple newlines in union/intersection types', () => {
    it('should parse union type with multiple newlines', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const phpdocString = `/** @var string |
       *
       * int */`;

      const tokens = new TokenIterator(lexer.tokenize(phpdocString));
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(UnionTypeNode);
      const union = type as UnionTypeNode;
      expect(union.types).toHaveLength(2);
      expect((union.types[0] as IdentifierTypeNode).name).toBe('string');
      expect((union.types[1] as IdentifierTypeNode).name).toBe('int');
    });

    it('should parse intersection type with multiple newlines', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const phpdocString = `/** @var Foo &
       *
       * Bar */`;

      const tokens = new TokenIterator(lexer.tokenize(phpdocString));
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(IntersectionTypeNode);
      const intersection = type as IntersectionTypeNode;
      expect(intersection.types).toHaveLength(2);
      expect((intersection.types[0] as IdentifierTypeNode).name).toBe('Foo');
      expect((intersection.types[1] as IdentifierTypeNode).name).toBe('Bar');
    });
  });

  describe('@param-immediately-invoked-callable tag', () => {
    it('should parse @param-immediately-invoked-callable tag', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize(
          '/** @param-immediately-invoked-callable $callback */',
        ),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as ParamImmediatelyInvokedCallableTagValueNode;
      expect(value).toBeInstanceOf(
        ParamImmediatelyInvokedCallableTagValueNode,
      );
      expect(value.parameterName).toBe('$callback');
    });

    it('should parse @phpstan-param-immediately-invoked-callable alias', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize(
          '/** @phpstan-param-immediately-invoked-callable $fn some desc */',
        ),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as ParamImmediatelyInvokedCallableTagValueNode;
      expect(value).toBeInstanceOf(
        ParamImmediatelyInvokedCallableTagValueNode,
      );
      expect(value.parameterName).toBe('$fn');
      expect(value.description).toBe('some desc');
    });
  });

  describe('@param-later-invoked-callable tag', () => {
    it('should parse @param-later-invoked-callable tag', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @param-later-invoked-callable $callback */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as ParamLaterInvokedCallableTagValueNode;
      expect(value).toBeInstanceOf(ParamLaterInvokedCallableTagValueNode);
      expect(value.parameterName).toBe('$callback');
    });
  });

  describe('@param-closure-this tag', () => {
    it('should parse @param-closure-this tag', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @param-closure-this Foo $callback */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as ParamClosureThisTagValueNode;
      expect(value).toBeInstanceOf(ParamClosureThisTagValueNode);
      expect(value.type).toBeInstanceOf(IdentifierTypeNode);
      expect((value.type as IdentifierTypeNode).name).toBe('Foo');
      expect(value.parameterName).toBe('$callback');
    });
  });

  describe('@pure-unless-callable-is-impure tag', () => {
    it('should parse @pure-unless-callable-is-impure tag', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize(
          '/** @pure-unless-callable-is-impure $callback */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as PureUnlessCallableIsImpureTagValueNode;
      expect(value).toBeInstanceOf(PureUnlessCallableIsImpureTagValueNode);
      expect(value.parameterName).toBe('$callback');
    });
  });

  describe('@require-extends / @require-implements tags', () => {
    it('should parse @phpstan-require-extends tag', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @phpstan-require-extends BaseClass */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as RequireExtendsTagValueNode;
      expect(value).toBeInstanceOf(RequireExtendsTagValueNode);
      expect(value.type).toBeInstanceOf(IdentifierTypeNode);
      expect((value.type as IdentifierTypeNode).name).toBe('BaseClass');
    });

    it('should parse @psalm-require-extends alias', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @psalm-require-extends SomeClass */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      expect(tag.value).toBeInstanceOf(RequireExtendsTagValueNode);
    });

    it('should parse @phpstan-require-implements tag', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @phpstan-require-implements SomeInterface */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as RequireImplementsTagValueNode;
      expect(value).toBeInstanceOf(RequireImplementsTagValueNode);
      expect(value.type).toBeInstanceOf(IdentifierTypeNode);
      expect((value.type as IdentifierTypeNode).name).toBe('SomeInterface');
    });

    it('should parse @psalm-require-implements alias', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @psalm-require-implements Countable */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      expect(tag.value).toBeInstanceOf(RequireImplementsTagValueNode);
    });
  });

  describe('ArrayShapeNode unsealed types', () => {
    it('should parse unsealed array shape with type hint', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var array{foo: string, ...<int, string>} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      expect(arrayShape.sealed).toBe(false);
      expect(arrayShape.unsealedType).toBeInstanceOf(
        ArrayShapeUnsealedTypeNode,
      );
      expect(arrayShape.unsealedType!.keyType).toBeInstanceOf(
        IdentifierTypeNode,
      );
      expect(
        (arrayShape.unsealedType!.keyType as IdentifierTypeNode).name,
      ).toBe('int');
      expect(arrayShape.unsealedType!.valueType).toBeInstanceOf(
        IdentifierTypeNode,
      );
    });

    it('should parse unsealed array shape with value-only type hint', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var array{foo: string, ...<string>} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      expect(arrayShape.sealed).toBe(false);
      expect(arrayShape.unsealedType).toBeInstanceOf(
        ArrayShapeUnsealedTypeNode,
      );
      expect(arrayShape.unsealedType!.keyType).toBeNull();
      expect(arrayShape.unsealedType!.valueType).toBeInstanceOf(
        IdentifierTypeNode,
      );
    });

    it('should parse unsealed list shape', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var list{string, ...<int>} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      expect(arrayShape.sealed).toBe(false);
      expect(arrayShape.kind).toBe('list');
      expect(arrayShape.unsealedType).toBeInstanceOf(
        ArrayShapeUnsealedTypeNode,
      );
      // List shapes only have value type, no key type
      expect(arrayShape.unsealedType!.keyType).toBeNull();
    });

    it('should preserve toString for unsealed array shapes', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var array{foo: string, ...<int, string>} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);
      expect(type.toString()).toBe('array{foo: string, ...<int, string>}');
    });
  });

  describe('non-empty-array and non-empty-list shapes', () => {
    it('should parse non-empty-array shape', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var non-empty-array{foo: string} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      expect(arrayShape.kind).toBe('non-empty-array');
      expect(arrayShape.items).toHaveLength(1);
    });

    it('should parse non-empty-list shape', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var non-empty-list{string, int} */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(ArrayShapeNode);
      const arrayShape = type as ArrayShapeNode;
      expect(arrayShape.kind).toBe('non-empty-list');
    });
  });

  describe('Callable type with templates', () => {
    it('should parse callable with template types', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var Closure<T>(T): T */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(CallableTypeNode);
      const callable = type as CallableTypeNode;
      expect(callable.templateTypes).toHaveLength(1);
      expect(callable.templateTypes[0].name).toBe('T');
    });

    it('should parse callable with bounded template types', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var Closure<T of Foo>(T): T */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);

      expect(type).toBeInstanceOf(CallableTypeNode);
      const callable = type as CallableTypeNode;
      expect(callable.templateTypes).toHaveLength(1);
      expect(callable.templateTypes[0].name).toBe('T');
      expect(callable.templateTypes[0].bound).toBeInstanceOf(
        IdentifierTypeNode,
      );
      expect(
        (callable.templateTypes[0].bound as IdentifierTypeNode).name,
      ).toBe('Foo');
    });

    it('should preserve toString for callable with templates', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @var Closure<T>(T): T */'),
      );
      tokens.next(); // skip /**
      tokens.next(); // skip @var

      const type = typeParser.parse(tokens);
      expect(type.toString()).toBe('Closure<T>(T): T');
    });
  });

  describe('Template tag via TypeParser.parseTemplateTagValue', () => {
    it('should parse template with default value', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @template T = string */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as TemplateTagValueNode;

      expect(value.name).toBe('T');
      expect(value.defaultTypeNode).toBeInstanceOf(IdentifierTypeNode);
      expect((value.defaultTypeNode as IdentifierTypeNode).name).toBe(
        'string',
      );
    });

    it('should parse template with bound, lower bound, and default', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize(
          '/** @template T of Upper super Lower = Default */',
        ),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as TemplateTagValueNode;

      expect(value.name).toBe('T');
      expect((value.bound as IdentifierTypeNode).name).toBe('Upper');
      expect((value.lowerBound as IdentifierTypeNode).name).toBe('Lower');
      expect((value.defaultTypeNode as IdentifierTypeNode).name).toBe(
        'Default',
      );
    });

    it('should produce correct toString for template', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize(
          '/** @template T of Upper super Lower = Default */',
        ),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      // @ts-expect-error - accessing value property
      const value = tag.value as TemplateTagValueNode;
      expect(value.toString()).toBe('T of Upper super Lower = Default');
    });
  });

  describe('Phan tag aliases', () => {
    it('should parse @phan-param alias', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @phan-param string $foo */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      expect(tag.toString()).toContain('@phan-param');
      // @ts-expect-error - accessing value property
      expect(tag.value.toString()).toContain('string');
    });

    it('should parse @phan-return alias', () => {
      const lexer = new Lexer();
      const constExprParser = new ConstExprParser();
      const typeParser = new TypeParser(constExprParser);
      const phpDocParser = new PhpDocParser(typeParser, constExprParser);

      const tokens = new TokenIterator(
        lexer.tokenize('/** @phan-return int */'),
      );

      const phpDoc = phpDocParser.parse(tokens);
      const tag = phpDoc.children[0];
      expect(tag.toString()).toContain('@phan-return');
    });
  });
});
