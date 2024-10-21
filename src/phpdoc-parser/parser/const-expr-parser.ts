import { ConstExprArrayItemNode } from '../ast/const-expr/const-expr-array-item-node';
import { ConstExprArrayNode } from '../ast/const-expr/const-expr-array-node';
import { ConstExprFalseNode } from '../ast/const-expr/const-expr-false-node';
import { ConstExprFloatNode } from '../ast/const-expr/const-expr-float-node';
import { ConstExprIntegerNode } from '../ast/const-expr/const-expr-integer-node';
import type { ConstExprNode } from '../ast/const-expr/const-expr-node';
import { ConstExprNullNode } from '../ast/const-expr/const-expr-null-node';
import { ConstExprStringNode } from '../ast/const-expr/const-expr-string-node';
import { ConstExprTrueNode } from '../ast/const-expr/const-expr-true-node';
import { ConstFetchNode } from '../ast/const-expr/const-fetch-node';
import { QuoteAwareConstExprStringNode } from '../ast/const-expr/quote-aware-const-expr-string-node';
import { Attribute } from '../ast/types';
import { Lexer } from '../lexer/lexer';
import { ParserException } from './parser-exception';
import { StringUnescaper } from './string-unescaper';
import type { TokenIterator } from './token-iterator';

export class ConstExprParser {
  private useLinesAttributes: boolean;

  private useIndexAttributes: boolean;

  /**
   * @param usedAttributes is an object that may have 'lines' and 'indexes' properties
   */
  constructor(
    private unescapeStrings: boolean = false,
    private quoteAwareConstExprString: boolean = false,
    usedAttributes: { lines?: boolean; indexes?: boolean } = {},
  ) {
    this.useLinesAttributes = usedAttributes.lines ?? false;
    this.useIndexAttributes = usedAttributes.indexes ?? false;
  }

  public parse(tokens: TokenIterator, trimStrings = false): ConstExprNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();
    if (tokens.isCurrentTokenType(Lexer.TOKEN_FLOAT)) {
      const value = tokens.currentTokenValue();
      tokens.next();

      return this.enrichWithAttributes(
        tokens,
        new ConstExprFloatNode(value.replaceAll('_', '')),
        startLine,
        startIndex,
      );
    }

    if (tokens.isCurrentTokenType(Lexer.TOKEN_INTEGER)) {
      const value = tokens.currentTokenValue();
      tokens.next();

      return this.enrichWithAttributes(
        tokens,
        new ConstExprIntegerNode(value.replaceAll('_', '')),
        startLine,
        startIndex,
      );
    }

    if (
      tokens.isCurrentTokenType(
        Lexer.TOKEN_SINGLE_QUOTED_STRING,
        Lexer.TOKEN_DOUBLE_QUOTED_STRING,
      )
    ) {
      let value = tokens.currentTokenValue();
      const type = tokens.currentTokenType();
      if (trimStrings) {
        if (this.unescapeStrings) {
          value = StringUnescaper.unescapeString(value);
        } else {
          value = value.substring(1, value.length - 1);
        }
      }
      tokens.next();

      if (this.quoteAwareConstExprString) {
        return this.enrichWithAttributes(
          tokens,
          new QuoteAwareConstExprStringNode(
            value,
            type === Lexer.TOKEN_SINGLE_QUOTED_STRING
              ? QuoteAwareConstExprStringNode.SINGLE_QUOTED
              : QuoteAwareConstExprStringNode.DOUBLE_QUOTED,
          ),
          startLine,
          startIndex,
        );
      }

      return this.enrichWithAttributes(
        tokens,
        new ConstExprStringNode(value),
        startLine,
        startIndex,
      );
    }
    if (tokens.isCurrentTokenType(Lexer.TOKEN_IDENTIFIER)) {
      const identifier = tokens.currentTokenValue();
      tokens.next();

      // eslint-disable-next-line default-case
      switch (identifier.toLowerCase()) {
        case 'true':
          return this.enrichWithAttributes(
            tokens,
            new ConstExprTrueNode(),
            startLine,
            startIndex,
          );
        case 'false':
          return this.enrichWithAttributes(
            tokens,
            new ConstExprFalseNode(),
            startLine,
            startIndex,
          );
        case 'null':
          return this.enrichWithAttributes(
            tokens,
            new ConstExprNullNode(),
            startLine,
            startIndex,
          );
        case 'array':
          tokens.consumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES);
          return this.parseArray(
            tokens,
            Lexer.TOKEN_CLOSE_PARENTHESES,
            startIndex,
          );
      }

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_DOUBLE_COLON)) {
        let classConstantName = '';
        let lastType = null;

        while (true) {
          if (
            lastType !== Lexer.TOKEN_IDENTIFIER &&
            tokens.currentTokenType() === Lexer.TOKEN_IDENTIFIER
          ) {
            classConstantName += tokens.currentTokenValue();
            tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
            lastType = Lexer.TOKEN_IDENTIFIER;
            // eslint-disable-next-line no-continue
            continue;
          }

          if (
            lastType !== Lexer.TOKEN_WILDCARD &&
            tokens.tryConsumeTokenType(Lexer.TOKEN_WILDCARD)
          ) {
            classConstantName += '*';
            lastType = Lexer.TOKEN_WILDCARD;

            if (tokens.getSkippedHorizontalWhiteSpaceIfAny() !== '') {
              break;
            }

            // eslint-disable-next-line no-continue
            continue;
          }

          if (lastType === null) {
            tokens.consumeTokenType(Lexer.TOKEN_WILDCARD);
          }

          break;
        }

        return this.enrichWithAttributes(
          tokens,
          new ConstFetchNode(identifier, classConstantName),
          startLine,
          startIndex,
        );
      }

      return this.enrichWithAttributes(
        tokens,
        new ConstFetchNode('', identifier),
        startLine,
        startIndex,
      );
    }

    if (tokens.tryConsumeTokenType(Lexer.TOKEN_OPEN_SQUARE_BRACKET)) {
      return this.parseArray(
        tokens,
        Lexer.TOKEN_CLOSE_SQUARE_BRACKET,
        startIndex,
      );
    }

    throw new ParserException(
      tokens.currentTokenValue(),
      tokens.currentTokenType(),
      tokens.currentTokenOffset(),
      Lexer.TOKEN_IDENTIFIER,
      null,
      tokens.currentTokenLine(),
    );
  }

  private parseArray(
    tokens: TokenIterator,
    endToken: string,
    startIndex: number,
  ): ConstExprArrayNode {
    const items: ConstExprArrayItemNode[] = [];

    const startLine = tokens.currentTokenLine();

    if (!tokens.tryConsumeTokenType(endToken)) {
      do {
        items.push(this.parseArrayItem(tokens));
      } while (
        tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA) &&
        !tokens.isCurrentTokenType(endToken)
      );
      tokens.consumeTokenType(endToken);
    }

    return this.enrichWithAttributes(
      tokens,
      new ConstExprArrayNode(items),
      startLine,
      startIndex,
    );
  }

  private parseArrayItem(tokens: TokenIterator): ConstExprArrayItemNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    const expr = this.parse(tokens);

    let key: ConstExprNode;
    let value: ConstExprNode;
    if (tokens.tryConsumeTokenType(Lexer.TOKEN_DOUBLE_ARROW)) {
      key = expr;
      value = this.parse(tokens);
    } else {
      key = null;
      value = expr;
    }

    return this.enrichWithAttributes(
      tokens,
      new ConstExprArrayItemNode(key, value),
      startLine,
      startIndex,
    );
  }

  private enrichWithAttributes<T extends ConstExprNode>(
    tokens: TokenIterator,
    node: T,
    startLine: number,
    startIndex: number,
  ): T {
    if (this.useLinesAttributes) {
      node.setAttribute(Attribute.START_LINE, startLine);
      node.setAttribute(Attribute.END_LINE, tokens.currentTokenLine());
    }

    if (this.useIndexAttributes) {
      node.setAttribute(Attribute.START_INDEX, startIndex);
      node.setAttribute(
        Attribute.END_INDEX,
        tokens.endIndexOfLastRelevantToken(),
      );
    }

    return node;
  }
}
