import { ConstExprNode } from './const-expr-node';

export class ConstExprStringNode extends ConstExprNode {
  public static readonly SINGLE_QUOTED = 1;

  public static readonly DOUBLE_QUOTED = 2;

  constructor(
    public value: string,
    public quoteType: number,
  ) {
    super();
  }

  public toString(): string {
    if (this.quoteType === ConstExprStringNode.SINGLE_QUOTED) {
      return `'${this.value.replace(/[\\']/g, '\\$&')}'`;
    }

    return `"${this.escapeDoubleQuotedString()}"`;
  }

  private escapeDoubleQuotedString(): string {
    // eslint-disable-next-line no-control-regex
    let escaped = this.value.replace(/["\n\r\t\x0B\f\v\\$]/g, '\\$&');

    const regexes = [
      // eslint-disable-next-line no-control-regex
      /[\x00-\x08\x0E-\x1F]/g,
      /[\xC0-\xC1]/g,
      /[\xF5-\xFF]/g,
      /\xE0[\x80-\x9F]/g,
      /\xF0[\x80-\x8F]/g,
      /[\xC2-\xDF](?![\x80-\xBF])/g,
      /[\xE0-\xEF](?![\x80-\xBF]{2})/g,
      /[\xF0-\xF4](?![\x80-\xBF]{3})/g,
      // eslint-disable-next-line no-control-regex
      /(?<=[\x00-\x7F\xF5-\xFF])[\x80-\xBF]/g,
      /(?<![\xC2-\xDF]|[\xE0-\xEF]|[\xE0-\xEF][\x80-\xBF]|[\xF0-\xF4]|[\xF0-\xF4][\x80-\xBF]|[\xF0-\xF4][\x80-\xBF]{2})[\x80-\xBF]/g,
      /(?<=[\xE0-\xEF])[\x80-\xBF](?![\x80-\xBF])/g,
      /(?<=[\xF0-\xF4])[\x80-\xBF](?![\x80-\xBF]{2})/g,
      /(?<=[\xF0-\xF4][\x80-\xBF])[\x80-\xBF](?![\x80-\xBF])/g,
    ];

    for (const regex of regexes) {
      escaped = escaped.replace(regex, (match) => {
        const hex = match.charCodeAt(0).toString(16);
        return `\\x${'0'.repeat(2 - hex.length) + hex}`;
      });
    }

    return escaped;
  }

  public getNodeType(): string {
    return 'ConstExprStringNode';
  }
}
