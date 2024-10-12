import type { BaseNode } from '../ast/base-node';
import { ConstExprArrayNode } from '../ast/const-expr/const-expr-array-node';
import { ConstExprIntegerNode } from '../ast/const-expr/const-expr-integer-node';
import { ConstExprStringNode } from '../ast/const-expr/const-expr-string-node';
import { QuoteAwareConstExprStringNode } from '../ast/const-expr/quote-aware-const-expr-string-node';
import { ArrayShapeItemNode } from '../ast/type/array-shape-item-node';
import {
  ArrayShapeNode,
  type ArrayShapeNodeKind,
} from '../ast/type/array-shape-node';
import { ArrayTypeNode } from '../ast/type/array-type-node';
import { CallableTypeNode } from '../ast/type/callable-type-node';
import { CallableTypeParameterNode } from '../ast/type/callable-type-parameter-node';
import { ConditionalTypeForParameterNode } from '../ast/type/conditional-type-for-parameter-node';
import { ConditionalTypeNode } from '../ast/type/conditional-type-node';
import { ConstTypeNode } from '../ast/type/const-type-node';
import {
  GenericTypeNode,
  type GenericTypeNodeVariance,
} from '../ast/type/generic-type-node';
import { IdentifierTypeNode } from '../ast/type/identifier-type-node';
import { IntersectionTypeNode } from '../ast/type/intersection-type-node';
import { NullableTypeNode } from '../ast/type/nullable-type-node';
import { ObjectShapeItemNode } from '../ast/type/object-shape-item-node';
import { ObjectShapeNode } from '../ast/type/object-shape-node';
import { OffsetAccessTypeNode } from '../ast/type/offset-access-type-node';
import { ThisTypeNode } from '../ast/type/this-type-node';
import type { TypeNode } from '../ast/type/type-node';
import { UnionTypeNode } from '../ast/type/union-type-node';
import { Attribute } from '../ast/types';
import { Lexer } from '../lexer/lexer';
import type { ConstExprParser } from './const-expr-parser';
import { ParserException } from './parser-exception';
import { StringUnescaper } from './string-unescaper';
import type { TokenIterator } from './token-iterator';

export class TypeParser {
  private useLinesAttributes: boolean;

  private useIndexAttributes: boolean;

  constructor(
    private constExprParser: ConstExprParser | null = null,
    private quoteAwareConstExprString = false,
    usedAttributes: { lines?: boolean; indexes?: boolean } = {},
  ) {
    this.useLinesAttributes = usedAttributes.lines ?? false;
    this.useIndexAttributes = usedAttributes.indexes ?? false;
  }

  public parse(tokens: TokenIterator): TypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    if (tokens.isCurrentTokenType(Lexer.TOKEN_NULLABLE)) {
      return this.parseNullable(tokens);
    }
    let type = this.parseAtomic(tokens);

    if (tokens.isCurrentTokenType(Lexer.TOKEN_UNION)) {
      type = this.parseUnion(tokens, type);
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_INTERSECTION)) {
      type = this.parseIntersection(tokens, type);
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
      type = this.tryParseArrayOrOffsetAccess(tokens, type);
    }

    return this.enrichWithAttributes(tokens, type, startLine, startIndex);
  }

  public enrichWithAttributes<T extends BaseNode>(
    tokens: TokenIterator,
    type: T,
    startLine: number,
    startIndex: number,
  ): T {
    if (this.useLinesAttributes) {
      type.setAttribute(Attribute.START_LINE, startLine);
      type.setAttribute(Attribute.END_LINE, tokens.currentTokenLine());
    }

    if (this.useIndexAttributes) {
      type.setAttribute(Attribute.START_INDEX, startIndex);
      type.setAttribute(
        Attribute.END_INDEX,
        tokens.endIndexOfLastRelevantToken(),
      );
    }

    return type;
  }

  private subParse(tokens: TokenIterator): TypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    let type: TypeNode;

    if (tokens.isCurrentTokenType(Lexer.TOKEN_NULLABLE)) {
      type = this.parseNullable(tokens);
    } else {
      type = this.parseAtomic(tokens);

      if (tokens.isCurrentTokenValue('is')) {
        type = this.parseConditional(tokens, type);
      } else {
        tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

        if (tokens.isCurrentTokenType(Lexer.TOKEN_UNION)) {
          type = this.subParseUnion(tokens, type);
        } else if (tokens.isCurrentTokenType(Lexer.TOKEN_INTERSECTION)) {
          type = this.subParseIntersection(tokens, type);
        }
      }
    }

    return this.enrichWithAttributes(tokens, type, startLine, startIndex);
  }

  private parseAtomic(tokens: TokenIterator): TypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    let type: TypeNode;

    if (tokens.tryConsumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES)) {
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
      type = this.subParse(tokens);
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

      tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PARENTHESES);

      if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
        type = this.tryParseArrayOrOffsetAccess(tokens, type);
      }

      return this.enrichWithAttributes(tokens, type, startLine, startIndex);
    }
    if (tokens.tryConsumeTokenType(Lexer.TOKEN_THIS_VARIABLE)) {
      type = new ThisTypeNode();

      if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
        type = this.tryParseArrayOrOffsetAccess(
          tokens,
          this.enrichWithAttributes(tokens, type, startLine, startIndex),
        );
      }

      return this.enrichWithAttributes(tokens, type, startLine, startIndex);
    }
    const currentTokenValue = tokens.currentTokenValue();
    tokens.pushSavePoint();

    if (tokens.tryConsumeTokenType(Lexer.TOKEN_IDENTIFIER)) {
      const identifierTypeNode = new IdentifierTypeNode(currentTokenValue);
      type = identifierTypeNode;

      if (!tokens.isCurrentTokenType(Lexer.TOKEN_DOUBLE_COLON)) {
        if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET)) {
          type = this.parseGeneric(tokens, identifierTypeNode);
        } else if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
          type = this.tryParseArrayOrOffsetAccess(tokens, type);
        } else if (
          ['array', 'list', 'object'].includes(identifierTypeNode.name) &&
          tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_CURLY_BRACKET) &&
          !tokens.isPrecededByHorizontalWhitespace()
        ) {
          if (identifierTypeNode.name === 'object') {
            type = this.parseObjectShape(tokens);
          } else {
            type = this.parseArrayShape(
              tokens,
              type,
              identifierTypeNode.name as ArrayShapeNodeKind,
            );
          }

          if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
            type = this.tryParseArrayOrOffsetAccess(tokens, type);
          }
        }
        return this.enrichWithAttributes(tokens, type, startLine, startIndex);
      }
      tokens.rollback();
    } else {
      tokens.dropSavePoint();
    }

    const exception = new ParserException(
      tokens.currentTokenValue(),
      tokens.currentTokenType(),
      tokens.currentTokenOffset(),
      Lexer.TOKEN_IDENTIFIER,
      null,
      tokens.currentTokenLine(),
    );

    if (this.constExprParser === null) {
      throw exception;
    }

    try {
      const constExpr = this.constExprParser.parse(tokens, true);
      if (constExpr instanceof ConstExprArrayNode) {
        throw exception;
      }

      return this.enrichWithAttributes(
        tokens,
        new ConstTypeNode(constExpr),
        startLine,
        startIndex,
      );
    } catch (error) {
      exception.cause = error;
      throw exception;
    }
  }

  private parseUnion(tokens: TokenIterator, type: TypeNode): TypeNode {
    const types = [type];

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_UNION)) {
      types.push(this.parseAtomic(tokens));
    }

    return new UnionTypeNode(types);
  }

  private subParseUnion(tokens: TokenIterator, type: TypeNode): TypeNode {
    const types = [type];

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_UNION)) {
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
      types.push(this.parseAtomic(tokens));
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    }

    return new UnionTypeNode(types);
  }

  private parseIntersection(tokens: TokenIterator, type: TypeNode): TypeNode {
    const types = [type];

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_INTERSECTION)) {
      types.push(this.parseAtomic(tokens));
    }

    return new IntersectionTypeNode(types);
  }

  private subParseIntersection(
    tokens: TokenIterator,
    type: TypeNode,
  ): TypeNode {
    const types = [type];

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_INTERSECTION)) {
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
      types.push(this.parseAtomic(tokens));
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    }

    return new IntersectionTypeNode(types);
  }

  private parseConditional(
    tokens: TokenIterator,
    subjectType: TypeNode,
  ): TypeNode {
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

    let negated = false;
    if (tokens.isCurrentTokenValue('not')) {
      negated = true;
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    }

    const targetType = this.parse(tokens);

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_NULLABLE);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const ifType = this.parse(tokens);

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_COLON);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const elseType = this.subParse(tokens);

    return new ConditionalTypeNode(
      subjectType,
      targetType,
      ifType,
      elseType,
      negated,
    );
  }

  private parseConditionalForParameter(
    tokens: TokenIterator,
    parameterName: string,
  ): TypeNode {
    tokens.consumeTokenType(Lexer.TOKEN_VARIABLE);
    tokens.consumeTokenValue(Lexer.TOKEN_IDENTIFIER, 'is');

    let negated = false;
    if (tokens.isCurrentTokenValue('not')) {
      negated = true;
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    }

    const targetType = this.parse(tokens);

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_NULLABLE);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const ifType = this.parse(tokens);

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_COLON);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const elseType = this.subParse(tokens);

    return new ConditionalTypeForParameterNode(
      parameterName,
      targetType,
      ifType,
      elseType,
      negated,
    );
  }

  private parseNullable(tokens: TokenIterator): TypeNode {
    tokens.consumeTokenType(Lexer.TOKEN_NULLABLE);

    const type = this.parseAtomic(tokens);

    return new NullableTypeNode(type);
  }

  public isHtml(tokens: TokenIterator): boolean {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET);

    if (!tokens.isCurrentTokenType(Lexer.TOKEN_IDENTIFIER)) {
      return false;
    }

    const htmlTagName = tokens.currentTokenValue();

    tokens.next();

    if (!tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET)) {
      return false;
    }

    while (!tokens.isCurrentTokenType(Lexer.TOKEN_END)) {
      if (
        tokens.tryConsumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET) &&
        tokens.currentTokenValue().includes(`/${htmlTagName}>`)
      ) {
        return true;
      }

      tokens.next();
    }

    return false;
  }

  public parseGeneric(
    tokens: TokenIterator,
    baseType: IdentifierTypeNode,
  ): GenericTypeNode {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const genericTypes: GenericTypeNode[] = [];
    const variances: GenericTypeNodeVariance[] = [];

    const [genericType, variance] = this.parseGenericTypeArgument(tokens);
    genericTypes.push(genericType as GenericTypeNode);
    variances.push(variance);

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET)) {
        // trailing comma
        break;
      }

      const [genericTypeToAddInWhileLoop, varianceToAddInWhileLoop] =
        this.parseGenericTypeArgument(tokens);
      genericTypes.push(genericTypeToAddInWhileLoop as GenericTypeNode);
      variances.push(varianceToAddInWhileLoop);
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    }

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET);

    const type = new GenericTypeNode(baseType, genericTypes, variances);

    const startLine = baseType.getAttribute(Attribute.START_LINE) as
      | number
      | null;
    const startIndex = baseType.getAttribute(Attribute.START_INDEX) as
      | number
      | null;
    if (startLine !== null && startIndex !== null) {
      return this.enrichWithAttributes(
        tokens,
        type,
        baseType.getAttribute(Attribute.START_LINE) as number,
        baseType.getAttribute(Attribute.START_INDEX) as number,
      );
    }
    return type;
  }

  private parseGenericTypeArgument(
    tokens: TokenIterator,
  ): [TypeNode, GenericTypeNodeVariance] {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    if (tokens.tryConsumeTokenType(Lexer.TOKEN_WILDCARD)) {
      return [
        this.enrichWithAttributes(
          tokens,
          new IdentifierTypeNode('mixed'),
          startLine,
          startIndex,
        ),
        GenericTypeNode.VARIANCE_BIVARIANT,
      ];
    }

    let variance: GenericTypeNodeVariance;

    if (tokens.tryConsumeTokenValue('contravariant')) {
      variance = GenericTypeNode.VARIANCE_CONTRAVARIANT;
    } else if (tokens.tryConsumeTokenValue('covariant')) {
      variance = GenericTypeNode.VARIANCE_COVARIANT;
    } else {
      variance = GenericTypeNode.VARIANCE_INVARIANT;
    }

    const type = this.parse(tokens);

    return [type, variance];
  }

  private parseCallable(
    tokens: TokenIterator,
    identifier: IdentifierTypeNode,
  ): CallableTypeNode {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const parameters: CallableTypeParameterNode[] = [];

    if (!tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PARENTHESES)) {
      parameters.push(this.parseCallableParameter(tokens));
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

      while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
        tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

        if (tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PARENTHESES)) {
          break;
        }

        parameters.push(this.parseCallableParameter(tokens));
        tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
      }
    }

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PARENTHESES);
    tokens.consumeTokenType(Lexer.TOKEN_COLON);

    const returnType = this.parseCallableReturnType(tokens);

    return new CallableTypeNode(identifier, parameters, returnType);
  }

  private parseCallableParameter(
    tokens: TokenIterator,
  ): CallableTypeParameterNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    const type = this.parse(tokens);
    const isReference = tokens.tryConsumeTokenType(Lexer.TOKEN_REFERENCE);
    const isVariadic = tokens.tryConsumeTokenType(Lexer.TOKEN_VARIADIC);

    let parameterName = '';

    if (tokens.isCurrentTokenType(Lexer.TOKEN_VARIABLE)) {
      parameterName = tokens.currentTokenValue();
      tokens.consumeTokenType(Lexer.TOKEN_VARIABLE);
    }

    const isOptional = tokens.tryConsumeTokenType(Lexer.TOKEN_EQUAL);

    return this.enrichWithAttributes(
      tokens,
      new CallableTypeParameterNode(
        type,
        isReference,
        isVariadic,
        parameterName,
        isOptional,
      ),
      startLine,
      startIndex,
    );
  }

  private parseCallableReturnType(tokens: TokenIterator): TypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    let type: TypeNode;
    if (tokens.isCurrentTokenType(Lexer.TOKEN_NULLABLE)) {
      return this.parseNullable(tokens);
    }
    if (tokens.tryConsumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES)) {
      type = this.parse(tokens);
      tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PARENTHESES);
      if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
        type = this.tryParseArrayOrOffsetAccess(tokens, type);
      }
      return type;
    }
    if (tokens.tryConsumeTokenType(Lexer.TOKEN_THIS_VARIABLE)) {
      type = new ThisTypeNode();
      if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
        type = this.tryParseArrayOrOffsetAccess(
          tokens,
          this.enrichWithAttributes(tokens, type, startLine, startIndex),
        );
      }
      return type;
    }
    const currentTokenValue = tokens.currentTokenValue();
    tokens.pushSavePoint();

    if (tokens.tryConsumeTokenType(Lexer.TOKEN_IDENTIFIER)) {
      type = new IdentifierTypeNode(currentTokenValue);

      if (!tokens.isCurrentTokenType(Lexer.TOKEN_DOUBLE_COLON)) {
        if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET)) {
          type = this.parseGeneric(
            tokens,
            this.enrichWithAttributes(
              tokens,
              type as IdentifierTypeNode,
              startLine,
              startIndex,
            ),
          );
        } else if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
          type = this.tryParseArrayOrOffsetAccess(
            tokens,
            this.enrichWithAttributes(tokens, type, startLine, startIndex),
          );
        }
      } else {
        tokens.rollback();
      }

      return type;
    }
    tokens.dropSavePoint();
    const exception = new ParserException(
      tokens.currentTokenValue(),
      tokens.currentTokenType(),
      tokens.currentTokenOffset(),
      Lexer.TOKEN_IDENTIFIER,
      null,
      tokens.currentTokenLine(),
    );

    if (this.constExprParser === null) {
      throw exception;
    }

    if (this.constExprParser === null) {
      throw exception;
    }

    try {
      const constExpr = this.constExprParser.parse(tokens, true);

      if (constExpr instanceof ConstExprArrayNode) {
        throw exception;
      }

      type = new ConstTypeNode(constExpr);

      if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
        type = this.tryParseArrayOrOffsetAccess(
          tokens,
          this.enrichWithAttributes(tokens, type, startLine, startIndex),
        );
      }

      return type;
    } catch (e) {
      if (e instanceof Error) {
        throw exception;
      } else {
        throw e;
      }
    }
  }

  private tryParseCallable(
    tokens: TokenIterator,
    identifier: IdentifierTypeNode,
  ): TypeNode {
    try {
      tokens.pushSavePoint();
      const type = this.parseCallable(tokens, identifier);
      tokens.dropSavePoint();
      return type;
    } catch (e) {
      if (e instanceof ParserException) {
        tokens.rollback();
        return identifier;
      }
      throw e;
    }
  }

  private tryParseArrayOrOffsetAccess(
    tokens: TokenIterator,
    type: TypeNode,
  ): TypeNode {
    try {
      while (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
        tokens.pushSavePoint();

        const canBeOffsetAccessType =
          !tokens.isPrecededByHorizontalWhitespace();

        tokens.consumeTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET);

        if (
          canBeOffsetAccessType &&
          !tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_SQUARE_BRACKET)
        ) {
          const offset = this.parse(tokens);
          tokens.consumeTokenType(Lexer.TOKEN_CLOSE_SQUARE_BRACKET);
          tokens.dropSavePoint();
          // eslint-disable-next-line no-param-reassign
          type = new OffsetAccessTypeNode(type, offset);
        } else {
          tokens.consumeTokenType(Lexer.TOKEN_CLOSE_SQUARE_BRACKET);
          tokens.dropSavePoint();
          // eslint-disable-next-line no-param-reassign
          type = new ArrayTypeNode(type);
        }
      }
    } catch (e) {
      if (e instanceof ParserException) {
        tokens.rollback();
      } else {
        throw e;
      }
    }

    return type;
  }

  private parseArrayShape(
    tokens: TokenIterator,
    type: TypeNode,
    kind: ArrayShapeNodeKind,
  ): ArrayShapeNode {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_CURLY_BRACKET);

    const items: (string | ArrayShapeItemNode)[] = [];
    let sealed = true;

    do {
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET)) {
        return new ArrayShapeNode(items, true, kind);
      }

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_VARIADIC)) {
        sealed = false;
        tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA);
        break;
      }

      items.push(this.parseArrayShapeItem(tokens));
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    } while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA));

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET);

    return new ArrayShapeNode(items, sealed, kind);
  }

  private parseArrayShapeItem(tokens: TokenIterator): ArrayShapeItemNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    try {
      tokens.pushSavePoint();
      const key = this.parseArrayShapeKey(tokens);
      const optional = tokens.tryConsumeTokenType(Lexer.TOKEN_NULLABLE);
      tokens.consumeTokenType(Lexer.TOKEN_COLON);
      const value = this.parse(tokens);
      tokens.dropSavePoint();

      return this.enrichWithAttributes(
        tokens,
        new ArrayShapeItemNode(key, optional, value),
        startLine,
        startIndex,
      );
    } catch (e) {
      if (e instanceof ParserException) {
        tokens.rollback();
        const value = this.parse(tokens);
        return this.enrichWithAttributes(
          tokens,
          new ArrayShapeItemNode(null, false, value),
          startLine,
          startIndex,
        );
      }
      throw e;
    }
  }

  private parseArrayShapeKey(
    tokens: TokenIterator,
  ): ConstExprIntegerNode | ConstExprStringNode | IdentifierTypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();
    let key: ConstExprIntegerNode | IdentifierTypeNode | ConstExprStringNode;

    if (tokens.isCurrentTokenType(Lexer.TOKEN_INTEGER)) {
      key = new ConstExprIntegerNode(
        tokens.currentTokenValue().replaceAll('_', ''),
      );
      tokens.next();
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_SINGLE_QUOTED_STRING)) {
      if (this.quoteAwareConstExprString) {
        key = new QuoteAwareConstExprStringNode(
          StringUnescaper.unescapeString(tokens.currentTokenValue()),
          QuoteAwareConstExprStringNode.SINGLE_QUOTED,
        );
      } else {
        key = new ConstExprStringNode(
          tokens.currentTokenValue().replace(/(^'|'$)/g, ''),
        );
      }
      tokens.next();
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_DOUBLE_QUOTED_STRING)) {
      if (this.quoteAwareConstExprString) {
        key = new QuoteAwareConstExprStringNode(
          StringUnescaper.unescapeString(tokens.currentTokenValue()),
          QuoteAwareConstExprStringNode.DOUBLE_QUOTED,
        );
      } else {
        key = new ConstExprStringNode(
          tokens.currentTokenValue().replace(/(^"|"$)/g, ''),
        );
      }
      tokens.next();
    } else {
      key = new IdentifierTypeNode(tokens.currentTokenValue());
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    }

    return this.enrichWithAttributes<
      ConstExprIntegerNode | IdentifierTypeNode | ConstExprStringNode
    >(tokens, key, startLine, startIndex);
  }

  private parseObjectShape(tokens: TokenIterator): ObjectShapeNode {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_CURLY_BRACKET);

    const items: ObjectShapeItemNode[] = [];

    do {
      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET)) {
        return new ObjectShapeNode(items);
      }

      items.push(this.parseObjectShapeItem(tokens));

      tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    } while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA));

    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET);

    return new ObjectShapeNode(items);
  }

  private parseObjectShapeItem(tokens: TokenIterator): ObjectShapeItemNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    const key = this.parseObjectShapeKey(tokens);
    const optional = tokens.tryConsumeTokenType(Lexer.TOKEN_NULLABLE);
    tokens.consumeTokenType(Lexer.TOKEN_COLON);

    const value = this.parse(tokens);

    return this.enrichWithAttributes(
      tokens,
      new ObjectShapeItemNode(key, optional, value),
      startLine,
      startIndex,
    );
  }

  private parseObjectShapeKey(
    tokens: TokenIterator,
  ): ConstExprStringNode | IdentifierTypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();
    let key: ConstExprStringNode | IdentifierTypeNode;

    if (tokens.isCurrentTokenType(Lexer.TOKEN_SINGLE_QUOTED_STRING)) {
      if (this.quoteAwareConstExprString) {
        key = new QuoteAwareConstExprStringNode(
          StringUnescaper.unescapeString(tokens.currentTokenValue()),
          QuoteAwareConstExprStringNode.SINGLE_QUOTED,
        );
      } else {
        key = new ConstExprStringNode(
          tokens.currentTokenValue().replace(/(^'|'$)/g, ''),
        );
      }
      tokens.next();
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_DOUBLE_QUOTED_STRING)) {
      if (this.quoteAwareConstExprString) {
        key = new QuoteAwareConstExprStringNode(
          StringUnescaper.unescapeString(tokens.currentTokenValue()),
          QuoteAwareConstExprStringNode.DOUBLE_QUOTED,
        );
      } else {
        key = new ConstExprStringNode(
          tokens.currentTokenValue().replace(/(^"|"$)/g, ''),
        );
      }
      tokens.next();
    } else {
      key = new IdentifierTypeNode(tokens.currentTokenValue());
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    }

    return this.enrichWithAttributes(tokens, key, startLine, startIndex);
  }
}
