import { Lexer } from '../lexer/lexer';

export class ParserException extends Error {
  private currentTokenValue: string;

  private currentTokenType: string;

  private currentOffset: number;

  private expectedTokenType: string;

  private expectedTokenValue: string | null;

  private currentTokenLine: number | null;

  public constructor(
    currentTokenValue: string,
    currentTokenType: string,
    currentOffset: number,
    expectedTokenType: string,
    expectedTokenValue: string | null = null,
    currentTokenLine: number | null = null,
  ) {
    super();

    this.currentTokenValue = currentTokenValue;
    this.currentTokenType = currentTokenType;
    this.currentOffset = currentOffset;
    this.expectedTokenType = expectedTokenType;
    this.expectedTokenValue = expectedTokenValue;
    this.currentTokenLine = currentTokenLine;

    this.message = `Unexpected token ${this.formatValue(
      currentTokenValue,
    )}, expected ${Lexer.TOKEN_LABELS[expectedTokenType]}${
      expectedTokenValue !== null
        ? ` (${this.formatValue(expectedTokenValue)})`
        : ''
    } at offset ${currentOffset}${
      currentTokenLine === null ? '' : ` on line ${currentTokenLine}`
    }`;
  }

  public getCurrentTokenValue(): string {
    return this.currentTokenValue;
  }

  public getCurrentTokenType(): string {
    return this.currentTokenType;
  }

  public getCurrentOffset(): number {
    return this.currentOffset;
  }

  public getExpectedTokenType(): string {
    return this.expectedTokenType;
  }

  public getExpectedTokenValue(): string | null {
    return this.expectedTokenValue;
  }

  public getCurrentTokenLine(): number | null {
    return this.currentTokenLine;
  }

  private formatValue(value: string): string {
    const json = JSON.stringify(value);
    if (!json) {
      throw new Error('JSON encoding error');
    }
    return json;
  }
}
