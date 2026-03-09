import type { BaseNode } from '../ast/base-node';
import { ConstExprArrayNode } from '../ast/const-expr/const-expr-array-node';
import { ConstExprIntegerNode } from '../ast/const-expr/const-expr-integer-node';
import { ConstExprStringNode } from '../ast/const-expr/const-expr-string-node';
import { ConstFetchNode } from '../ast/const-expr/const-fetch-node';
import { TemplateTagValueNode } from '../ast/php-doc/template-tag-value-node';
import { ArrayShapeItemNode } from '../ast/type/array-shape-item-node';
import {
  ArrayShapeNode,
  ArrayShapeNodeKind,
} from '../ast/type/array-shape-node';
import { ArrayShapeUnsealedTypeNode } from '../ast/type/array-shape-unsealed-type-node';
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

    tokens.pushSavePoint();
    tokens.skipNewLineTokensAndConsumeComments();

    let enrichedType: TypeNode | null = null;
    try {
      enrichedType = this.enrichTypeOnUnionOrIntersection(tokens, type);
    } catch {
      enrichedType = null;
    }

    if (enrichedType !== null) {
      type = enrichedType;
      tokens.dropSavePoint();
    } else {
      tokens.rollback();
      type = this.enrichTypeOnUnionOrIntersection(tokens, type) ?? type;
    }

    return this.enrichWithAttributes(tokens, type, startLine, startIndex);
  }

  private enrichTypeOnUnionOrIntersection(
    tokens: TokenIterator,
    type: TypeNode,
  ): TypeNode | null {
    if (tokens.isCurrentTokenType(Lexer.TOKEN_UNION)) {
      return this.parseUnion(tokens, type);
    }

    if (tokens.isCurrentTokenType(Lexer.TOKEN_INTERSECTION)) {
      return this.parseIntersection(tokens, type);
    }

    return null;
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

    tokens.flushComments();

    if (this.useIndexAttributes) {
      type.setAttribute(Attribute.START_INDEX, startIndex);
      type.setAttribute(
        Attribute.END_INDEX,
        tokens.endIndexOfLastRelevantToken(),
      );
    }

    return type;
  }

  public parseTemplateTagValue(
    tokens: TokenIterator,
    parseDescription?: (tokens: TokenIterator) => string,
  ): TemplateTagValueNode {
    const name = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

    let upperBound: TypeNode | null = null;
    let lowerBound: TypeNode | null = null;

    if (
      tokens.tryConsumeTokenValue('of') ||
      tokens.tryConsumeTokenValue('as')
    ) {
      upperBound = this.parse(tokens);
    }

    if (tokens.tryConsumeTokenValue('super')) {
      lowerBound = this.parse(tokens);
    }

    let defaultValue: TypeNode | null = null;
    if (tokens.tryConsumeTokenValue('=')) {
      defaultValue = this.parse(tokens);
    }

    let description = '';
    if (parseDescription) {
      description = parseDescription(tokens);
    }

    if (name === '') {
      throw new Error('Template tag name cannot be empty.');
    }

    return new TemplateTagValueNode(
      name,
      upperBound,
      description,
      defaultValue,
      lowerBound,
    );
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
        tokens.skipNewLineTokensAndConsumeComments();

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
      tokens.skipNewLineTokensAndConsumeComments();
      type = this.subParse(tokens);
      tokens.skipNewLineTokensAndConsumeComments();

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
        tokens.dropSavePoint();
        if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET)) {
          tokens.pushSavePoint();

          const isHtml = this.isHtml(tokens);
          tokens.rollback();
          if (isHtml) {
            return this.enrichWithAttributes(
              tokens,
              type,
              startLine,
              startIndex,
            );
          }

          const origType = type;
          type = this.tryParseCallable(tokens, identifierTypeNode, true);
          if (type === origType) {
            type = this.parseGeneric(tokens, identifierTypeNode);

            if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
              type = this.tryParseArrayOrOffsetAccess(tokens, type);
            }
          }
        } else if (
          tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_PARENTHESES)
        ) {
          type = this.tryParseCallable(tokens, identifierTypeNode, false);
        } else if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
          type = this.tryParseArrayOrOffsetAccess(tokens, type);
        } else if (
          [
            'array',
            'list',
            'non-empty-array',
            'non-empty-list',
            'object',
          ].includes(identifierTypeNode.name) &&
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
            type = this.tryParseArrayOrOffsetAccess(
              tokens,
              this.enrichWithAttributes(tokens, type, startLine, startIndex),
            );
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
      // Allow multiple consecutive newlines
      tokens.skipNewLineTokensAndConsumeComments();
      types.push(this.parseAtomic(tokens));
    }

    return new UnionTypeNode(types);
  }

  private subParseUnion(tokens: TokenIterator, type: TypeNode): TypeNode {
    const types = [type];

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_UNION)) {
      // Allow multiple consecutive newlines
      tokens.skipNewLineTokensAndConsumeComments();
      types.push(this.parseAtomic(tokens));
      // Allow multiple consecutive newlines after type
      tokens.skipNewLineTokensAndConsumeComments();
    }

    return new UnionTypeNode(types);
  }

  private parseIntersection(tokens: TokenIterator, type: TypeNode): TypeNode {
    const types = [type];

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_INTERSECTION)) {
      // Allow multiple consecutive newlines
      tokens.skipNewLineTokensAndConsumeComments();
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
      // Allow multiple consecutive newlines
      tokens.skipNewLineTokensAndConsumeComments();
      types.push(this.parseAtomic(tokens));
      // Allow multiple consecutive newlines after type
      tokens.skipNewLineTokensAndConsumeComments();
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

    tokens.skipNewLineTokensAndConsumeComments();
    tokens.consumeTokenType(Lexer.TOKEN_NULLABLE);
    tokens.skipNewLineTokensAndConsumeComments();

    const ifType = this.parse(tokens);

    tokens.skipNewLineTokensAndConsumeComments();
    tokens.consumeTokenType(Lexer.TOKEN_COLON);
    tokens.skipNewLineTokensAndConsumeComments();

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

    tokens.skipNewLineTokensAndConsumeComments();
    tokens.consumeTokenType(Lexer.TOKEN_NULLABLE);
    tokens.skipNewLineTokensAndConsumeComments();

    const ifType = this.parse(tokens);

    tokens.skipNewLineTokensAndConsumeComments();
    tokens.consumeTokenType(Lexer.TOKEN_COLON);
    tokens.skipNewLineTokensAndConsumeComments();

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
    tokens.skipNewLineTokensAndConsumeComments();

    const genericTypes: GenericTypeNode[] = [];
    const variances: GenericTypeNodeVariance[] = [];

    const [genericType, variance] = this.parseGenericTypeArgument(tokens);
    genericTypes.push(genericType as GenericTypeNode);
    variances.push(variance);

    tokens.skipNewLineTokensAndConsumeComments();

    while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
      tokens.skipNewLineTokensAndConsumeComments();

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET)) {
        // trailing comma
        break;
      }

      const [genericTypeToAddInWhileLoop, varianceToAddInWhileLoop] =
        this.parseGenericTypeArgument(tokens);
      genericTypes.push(genericTypeToAddInWhileLoop as GenericTypeNode);
      variances.push(varianceToAddInWhileLoop);
      tokens.skipNewLineTokensAndConsumeComments();
    }

    tokens.skipNewLineTokensAndConsumeComments();
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
    hasTemplate: boolean,
  ): CallableTypeNode {
    const templates = hasTemplate
      ? this.parseCallableTemplates(tokens)
      : [];

    tokens.consumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES);
    tokens.skipNewLineTokensAndConsumeComments();

    const parameters: CallableTypeParameterNode[] = [];

    if (!tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PARENTHESES)) {
      parameters.push(this.parseCallableParameter(tokens));
      tokens.skipNewLineTokensAndConsumeComments();

      while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
        tokens.skipNewLineTokensAndConsumeComments();

        if (tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PARENTHESES)) {
          break;
        }

        parameters.push(this.parseCallableParameter(tokens));
        tokens.skipNewLineTokensAndConsumeComments();
      }
    }

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PARENTHESES);
    tokens.consumeTokenType(Lexer.TOKEN_COLON);

    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();
    const returnType = this.enrichWithAttributes(
      tokens,
      this.parseCallableReturnType(tokens),
      startLine,
      startIndex,
    );

    return new CallableTypeNode(identifier, parameters, returnType, templates);
  }

  private parseCallableTemplates(tokens: TokenIterator): TemplateTagValueNode[] {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET);

    const templates: TemplateTagValueNode[] = [];

    let isFirst = true;
    while (isFirst || tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
      tokens.skipNewLineTokensAndConsumeComments();

      // trailing comma case
      if (
        !isFirst &&
        tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET)
      ) {
        break;
      }
      isFirst = false;

      templates.push(this.parseCallableTemplateArgument(tokens));
      tokens.skipNewLineTokensAndConsumeComments();
    }

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET);

    return templates;
  }

  private parseCallableTemplateArgument(
    tokens: TokenIterator,
  ): TemplateTagValueNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    return this.enrichWithAttributes(
      tokens,
      this.parseTemplateTagValue(tokens),
      startLine,
      startIndex,
    );
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
    hasTemplate: boolean,
  ): TypeNode {
    try {
      tokens.pushSavePoint();
      const type = this.parseCallable(tokens, identifier, hasTemplate);
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

    const items: ArrayShapeItemNode[] = [];
    let sealed = true;
    let unsealedType: ArrayShapeUnsealedTypeNode | null = null;

    let done = false;

    do {
      tokens.skipNewLineTokensAndConsumeComments();

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET)) {
        return new ArrayShapeNode(items, true, kind);
      }

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_VARIADIC)) {
        sealed = false;

        tokens.skipNewLineTokensAndConsumeComments();
        if (tokens.isCurrentTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET)) {
          if (
            kind === ArrayShapeNodeKind.ARRAY ||
            kind === ArrayShapeNodeKind.NON_EMPTY_ARRAY
          ) {
            unsealedType = this.parseArrayShapeUnsealedType(tokens);
          } else {
            unsealedType = this.parseListShapeUnsealedType(tokens);
          }
          tokens.skipNewLineTokensAndConsumeComments();
        }

        tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA);
        break;
      }

      items.push(this.parseArrayShapeItem(tokens));
      tokens.skipNewLineTokensAndConsumeComments();
      if (!tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
        done = true;
      }
    } while (!done);

    tokens.skipNewLineTokensAndConsumeComments();
    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET);

    if (sealed) {
      return new ArrayShapeNode(items, true, kind);
    }

    return new ArrayShapeNode(items, false, kind, unsealedType);
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
  ):
    | ConstExprIntegerNode
    | ConstExprStringNode
    | ConstFetchNode
    | IdentifierTypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();
    let key:
      | ConstExprIntegerNode
      | ConstExprStringNode
      | ConstFetchNode
      | IdentifierTypeNode;

    if (tokens.isCurrentTokenType(Lexer.TOKEN_INTEGER)) {
      key = new ConstExprIntegerNode(
        tokens.currentTokenValue().replaceAll('_', ''),
      );
      tokens.next();
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_SINGLE_QUOTED_STRING)) {
      key = new ConstExprStringNode(
        StringUnescaper.unescapeString(tokens.currentTokenValue()),
        ConstExprStringNode.SINGLE_QUOTED,
      );
      tokens.next();
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_DOUBLE_QUOTED_STRING)) {
      key = new ConstExprStringNode(
        StringUnescaper.unescapeString(tokens.currentTokenValue()),
        ConstExprStringNode.DOUBLE_QUOTED,
      );
      tokens.next();
    } else {
      const identifier = tokens.currentTokenValue();
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_DOUBLE_COLON)) {
        const classConstantName = tokens.currentTokenValue();
        tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

        key = new ConstFetchNode(identifier, classConstantName);
      } else {
        key = new IdentifierTypeNode(identifier);
      }
    }

    return this.enrichWithAttributes(tokens, key, startLine, startIndex);
  }

  private parseArrayShapeUnsealedType(
    tokens: TokenIterator,
  ): ArrayShapeUnsealedTypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    tokens.consumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET);
    tokens.skipNewLineTokensAndConsumeComments();

    let valueType = this.parse(tokens);
    tokens.skipNewLineTokensAndConsumeComments();

    let keyType: TypeNode | null = null;
    if (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
      tokens.skipNewLineTokensAndConsumeComments();

      keyType = valueType;
      valueType = this.parse(tokens);
      tokens.skipNewLineTokensAndConsumeComments();
    }

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET);

    return this.enrichWithAttributes(
      tokens,
      new ArrayShapeUnsealedTypeNode(valueType, keyType),
      startLine,
      startIndex,
    );
  }

  private parseListShapeUnsealedType(
    tokens: TokenIterator,
  ): ArrayShapeUnsealedTypeNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    tokens.consumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET);
    tokens.skipNewLineTokensAndConsumeComments();

    const valueType = this.parse(tokens);
    tokens.skipNewLineTokensAndConsumeComments();

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET);

    return this.enrichWithAttributes(
      tokens,
      new ArrayShapeUnsealedTypeNode(valueType, null),
      startLine,
      startIndex,
    );
  }

  private parseObjectShape(tokens: TokenIterator): ObjectShapeNode {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_CURLY_BRACKET);

    const items: ObjectShapeItemNode[] = [];

    do {
      tokens.skipNewLineTokensAndConsumeComments();

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_CLOSE_CURLY_BRACKET)) {
        return new ObjectShapeNode(items);
      }

      items.push(this.parseObjectShapeItem(tokens));

      tokens.skipNewLineTokensAndConsumeComments();
    } while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA));

    tokens.skipNewLineTokensAndConsumeComments();
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
      key = new ConstExprStringNode(
        StringUnescaper.unescapeString(tokens.currentTokenValue()),
        ConstExprStringNode.SINGLE_QUOTED,
      );
      tokens.next();
    } else if (tokens.isCurrentTokenType(Lexer.TOKEN_DOUBLE_QUOTED_STRING)) {
      key = new ConstExprStringNode(
        StringUnescaper.unescapeString(tokens.currentTokenValue()),
        ConstExprStringNode.DOUBLE_QUOTED,
      );
      tokens.next();
    } else {
      key = new IdentifierTypeNode(tokens.currentTokenValue());
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    }

    return this.enrichWithAttributes(tokens, key, startLine, startIndex);
  }
}
