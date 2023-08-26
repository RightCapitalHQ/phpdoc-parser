import { ParserException } from './parser-exception';
import { Lexer } from '../lexer/lexer';

export class TokenIterator {
  private tokens: Array<[string, string, number]>;

  private index: number;

  private savePoints: number[] = [];

  private skippedTokenTypes: string[] = [Lexer.TOKEN_HORIZONTAL_WS];

  private newline: string | null = null;

  constructor(tokens: Array<[string, string, number]>, index = 0) {
    this.tokens = tokens;
    this.index = index;

    this.skipIrrelevantTokens();
  }

  public getTokens(): Array<[string, string, number]> {
    return this.tokens;
  }

  public getContentBetween(startPos: number, endPos: number): string {
    if (startPos < 0 || endPos > this.tokens.length) {
      throw new Error('LogicException');
    }

    let content = '';
    // eslint-disable-next-line no-plusplus
    for (let i = startPos; i < endPos; i++) {
      content += this.tokens[i][Lexer.VALUE_OFFSET];
    }

    return content;
  }

  public getTokenCount(): number {
    return this.tokens.length;
  }

  public currentTokenValue(): string {
    return this.tokens[this.index][Lexer.VALUE_OFFSET];
  }

  public currentTokenType(): string {
    return this.tokens[this.index][Lexer.TYPE_OFFSET];
  }

  public currentTokenOffset(): number {
    let offset = 0;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.index; i++) {
      offset += this.tokens[i][Lexer.VALUE_OFFSET].length;
    }

    return offset;
  }

  public currentTokenLine(): number {
    return this.tokens[this.index][Lexer.LINE_OFFSET];
  }

  public currentTokenIndex(): number {
    return this.index;
  }

  public endIndexOfLastRelevantToken(): number {
    let endIndex = this.currentTokenIndex();
    // eslint-disable-next-line no-plusplus
    endIndex--;
    while (
      this.skippedTokenTypes.includes(this.tokens[endIndex][Lexer.TYPE_OFFSET])
    ) {
      if (!this.tokens[endIndex - 1]) {
        break;
      }
      // eslint-disable-next-line no-plusplus
      endIndex--;
    }

    return endIndex;
  }

  public isCurrentTokenValue(tokenValue: string): boolean {
    return this.tokens[this.index][Lexer.VALUE_OFFSET] === tokenValue;
  }

  public isCurrentTokenType(...tokenType: string[]): boolean {
    return tokenType.includes(this.tokens[this.index][Lexer.TYPE_OFFSET]);
  }

  public isPrecededByHorizontalWhitespace(): boolean {
    return (
      (this.tokens[this.index - 1]?.[Lexer.TYPE_OFFSET] ?? -1) ===
      Lexer.TOKEN_HORIZONTAL_WS
    );
  }

  consumeTokenType(tokenType: string): void {
    if (this.tokens[this.index][Lexer.TYPE_OFFSET] !== tokenType) {
      this.throwError(tokenType);
    }

    if (tokenType === Lexer.TOKEN_PHPDOC_EOL) {
      if (this.newline === null) {
        this.detectNewline();
      }
    }

    // eslint-disable-next-line no-plusplus
    this.index++;
    this.skipIrrelevantTokens();
  }

  consumeTokenValue(tokenType: string, tokenValue: string): void {
    if (
      this.tokens[this.index][Lexer.TYPE_OFFSET] !== tokenType ||
      this.tokens[this.index][Lexer.VALUE_OFFSET] !== tokenValue
    ) {
      this.throwError(tokenType, tokenValue);
    }

    // eslint-disable-next-line no-plusplus
    this.index++;
    this.skipIrrelevantTokens();
  }

  tryConsumeTokenValue(tokenValue: string): boolean {
    if (this.tokens[this.index][Lexer.VALUE_OFFSET] !== tokenValue) {
      return false;
    }

    // eslint-disable-next-line no-plusplus
    this.index++;
    this.skipIrrelevantTokens();

    return true;
  }

  tryConsumeTokenType(tokenType: string): boolean {
    if (this.tokens[this.index][Lexer.TYPE_OFFSET] !== tokenType) {
      return false;
    }

    if (tokenType === Lexer.TOKEN_PHPDOC_EOL) {
      if (this.newline === null) {
        this.detectNewline();
      }
    }

    // eslint-disable-next-line no-plusplus
    this.index++;
    this.skipIrrelevantTokens();

    return true;
  }

  private detectNewline(): void {
    const value = this.currentTokenValue();
    if (value.substring(0, 2) === '\r\n') {
      this.newline = '\r\n';
    } else if (value.substring(0, 1) === '\n') {
      this.newline = '\n';
    }
  }

  public getSkippedHorizontalWhiteSpaceIfAny(): string {
    if (
      this.index > 0 &&
      this.tokens[this.index - 1][1] === Lexer.TOKEN_HORIZONTAL_WS
    ) {
      return this.tokens[this.index - 1][0];
    }
    return '';
  }

  public joinUntil(...tokenType: string[]): string {
    let s = '';
    while (!tokenType.includes(this.tokens[this.index][1])) {
      // eslint-disable-next-line no-plusplus
      s += this.tokens[this.index++][0];
    }
    return s;
  }

  public next(): void {
    // eslint-disable-next-line no-plusplus
    this.index++;
    this.skipIrrelevantTokens();
  }

  private skipIrrelevantTokens(): void {
    if (this.tokens[this.index] === undefined) {
      return;
    }

    while (
      this.skippedTokenTypes.includes(
        this.tokens[this.index][Lexer.TYPE_OFFSET],
      )
    ) {
      if (this.tokens[this.index + 1] === undefined) {
        break;
      }

      // eslint-disable-next-line no-plusplus
      this.index++;
    }
  }

  public addEndOfLineToSkippedTokens(): void {
    this.skippedTokenTypes = [
      Lexer.TOKEN_HORIZONTAL_WS,
      Lexer.TOKEN_PHPDOC_EOL,
    ];
  }

  public removeEndOfLineFromSkippedTokens(): void {
    this.skippedTokenTypes = [Lexer.TOKEN_HORIZONTAL_WS];
  }

  public forwardToTheEnd(): void {
    const lastToken = this.tokens.length - 1;
    this.index = lastToken;
  }

  public pushSavePoint(): void {
    this.savePoints.push(this.index);
  }

  public dropSavePoint(): void {
    this.savePoints.pop();
  }

  public rollback(): void {
    const index = this.savePoints.pop();
    // assert(index !== null);
    this.index = index;
  }

  throwError(
    expectedTokenType: string,
    expectedTokenValue: string | null = null,
  ): void {
    throw new ParserException(
      this.currentTokenValue(),
      this.currentTokenType(),
      this.currentTokenOffset(),
      expectedTokenType,
      expectedTokenValue,
      this.currentTokenLine(),
    );
  }

  // Remember to translate the current* methods as well

  public hasTokenImmediatelyBefore(
    pos: number,
    expectedTokenType: string,
  ): boolean {
    const { tokens } = this;
    // eslint-disable-next-line no-plusplus, no-param-reassign
    pos--;
    // eslint-disable-next-line no-plusplus, no-param-reassign
    for (; pos >= 0; pos--) {
      const token = tokens[pos];
      const type = token[1];
      if (type === expectedTokenType) {
        return true;
      }
      if (![Lexer.TOKEN_HORIZONTAL_WS, Lexer.TOKEN_PHPDOC_EOL].includes(type)) {
        break;
      }
    }
    return false;
  }

  public hasTokenImmediatelyAfter(
    pos: number,
    expectedTokenType: string,
  ): boolean {
    const { tokens } = this;
    // eslint-disable-next-line no-plusplus, no-param-reassign
    pos++;
    // eslint-disable-next-line no-plusplus, no-param-reassign
    for (let c = tokens.length; pos < c; pos++) {
      const token = tokens[pos];
      const type = token[1];
      if (type === expectedTokenType) {
        return true;
      }
      if (![Lexer.TOKEN_HORIZONTAL_WS, Lexer.TOKEN_PHPDOC_EOL].includes(type)) {
        break;
      }
    }
    return false;
  }

  public getDetectedNewline(): string | null {
    return this.newline;
  }

  public hasParentheses(startPos: number, endPos: number): boolean {
    return (
      this.hasTokenImmediatelyBefore(startPos, Lexer.TOKEN_OPEN_PARENTHESES) &&
      this.hasTokenImmediatelyAfter(endPos, Lexer.TOKEN_CLOSE_PARENTHESES)
    );
  }
}
