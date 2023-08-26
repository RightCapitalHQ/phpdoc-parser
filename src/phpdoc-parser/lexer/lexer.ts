export class Lexer {
  public static TOKEN_REFERENCE = 'TOKEN_REFERENCE';

  public static TOKEN_UNION = 'TOKEN_UNION';

  public static TOKEN_INTERSECTION = 'TOKEN_INTERSECTION';

  public static TOKEN_NULLABLE = 'TOKEN_NULLABLE';

  public static TOKEN_OPEN_PARENTHESES = 'TOKEN_OPEN_PARENTHESES';

  public static TOKEN_CLOSE_PARENTHESES = 'TOKEN_CLOSE_PARENTHESES';

  public static TOKEN_OPEN_ANGLE_BRACKET = 'TOKEN_OPEN_ANGLE_BRACKET';

  public static TOKEN_CLOSE_ANGLE_BRACKET = 'TOKEN_CLOSE_ANGLE_BRACKET';

  public static TOKEN_OPEN_SQUARE_BRACKET = 'TOKEN_OPEN_SQUARE_BRACKET';

  public static TOKEN_CLOSE_SQUARE_BRACKET = 'TOKEN_CLOSE_SQUARE_BRACKET';

  public static TOKEN_COMMA = 'TOKEN_COMMA';

  public static TOKEN_VARIADIC = 'TOKEN_VARIADIC';

  public static TOKEN_DOUBLE_COLON = 'TOKEN_DOUBLE_COLON';

  public static TOKEN_DOUBLE_ARROW = 'TOKEN_DOUBLE_ARROW';

  public static TOKEN_EQUAL = 'TOKEN_EQUAL';

  public static TOKEN_OPEN_PHPDOC = 'TOKEN_OPEN_PHPDOC';

  public static TOKEN_CLOSE_PHPDOC = 'TOKEN_CLOSE_PHPDOC';

  public static TOKEN_PHPDOC_TAG = 'TOKEN_PHPDOC_TAG';

  public static TOKEN_FLOAT = 'TOKEN_FLOAT';

  public static TOKEN_INTEGER = 'TOKEN_INTEGER';

  public static TOKEN_SINGLE_QUOTED_STRING = 'TOKEN_SINGLE_QUOTED_STRING';

  public static TOKEN_DOUBLE_QUOTED_STRING = 'TOKEN_DOUBLE_QUOTED_STRING';

  public static TOKEN_IDENTIFIER = 'TOKEN_IDENTIFIER';

  public static TOKEN_THIS_VARIABLE = 'TOKEN_THIS_VARIABLE';

  public static TOKEN_VARIABLE = 'TOKEN_VARIABLE';

  public static TOKEN_HORIZONTAL_WS = 'TOKEN_HORIZONTAL_WS';

  public static TOKEN_PHPDOC_EOL = 'TOKEN_PHPDOC_EOL';

  public static TOKEN_OTHER = 'TOKEN_OTHER';

  public static TOKEN_END = 'TOKEN_END';

  public static TOKEN_COLON = 'TOKEN_COLON';

  public static TOKEN_WILDCARD = 'TOKEN_WILDCARD';

  public static TOKEN_OPEN_CURLY_BRACKET = 'TOKEN_OPEN_CURLY_BRACKET';

  public static TOKEN_CLOSE_CURLY_BRACKET = 'TOKEN_CLOSE_CURLY_BRACKET';

  public static TOKEN_NEGATED = 'TOKEN_NEGATED';

  public static TOKEN_ARROW = 'TOKEN_ARROW';

  public static TOKEN_LABELS = {
    [Lexer.TOKEN_REFERENCE]: '&',
    [Lexer.TOKEN_UNION]: '|',
    [Lexer.TOKEN_INTERSECTION]: '&',
    [Lexer.TOKEN_NULLABLE]: '?',
    [Lexer.TOKEN_NEGATED]: '!',
    [Lexer.TOKEN_OPEN_PARENTHESES]: '(',
    [Lexer.TOKEN_CLOSE_PARENTHESES]: ')',
    [Lexer.TOKEN_OPEN_ANGLE_BRACKET]: '<',
    [Lexer.TOKEN_CLOSE_ANGLE_BRACKET]: '>',
    [Lexer.TOKEN_OPEN_SQUARE_BRACKET]: '[',
    [Lexer.TOKEN_CLOSE_SQUARE_BRACKET]: ']',
    [Lexer.TOKEN_OPEN_CURLY_BRACKET]: '{',
    [Lexer.TOKEN_CLOSE_CURLY_BRACKET]: '}',
    [Lexer.TOKEN_COMMA]: ',',
    [Lexer.TOKEN_COLON]: ':',
    [Lexer.TOKEN_VARIADIC]: '...',
    [Lexer.TOKEN_DOUBLE_COLON]: '::',
    [Lexer.TOKEN_DOUBLE_ARROW]: '=>',
    [Lexer.TOKEN_ARROW]: '->',
    [Lexer.TOKEN_EQUAL]: '=',
    [Lexer.TOKEN_OPEN_PHPDOC]: '/**',
    [Lexer.TOKEN_CLOSE_PHPDOC]: '*/',
    [Lexer.TOKEN_PHPDOC_TAG]: 'TOKEN_PHPDOC_TAG',
    [Lexer.TOKEN_PHPDOC_EOL]: 'TOKEN_PHPDOC_EOL',
    [Lexer.TOKEN_FLOAT]: 'TOKEN_FLOAT',
    [Lexer.TOKEN_INTEGER]: 'TOKEN_INTEGER',
    [Lexer.TOKEN_SINGLE_QUOTED_STRING]: 'TOKEN_SINGLE_QUOTED_STRING',
    [Lexer.TOKEN_DOUBLE_QUOTED_STRING]: 'TOKEN_DOUBLE_QUOTED_STRING',
    [Lexer.TOKEN_IDENTIFIER]: 'type',
    [Lexer.TOKEN_THIS_VARIABLE]: '$this',
    [Lexer.TOKEN_VARIABLE]: 'variable',
    [Lexer.TOKEN_HORIZONTAL_WS]: 'TOKEN_HORIZONTAL_WS',
    [Lexer.TOKEN_OTHER]: 'TOKEN_OTHER',
    [Lexer.TOKEN_END]: 'TOKEN_END',
    [Lexer.TOKEN_WILDCARD]: '*',
  };

  public static VALUE_OFFSET = 0 as const;

  public static TYPE_OFFSET = 1 as const;

  public static LINE_OFFSET = 2 as const;

  private regexp: RegExp = this.generateRegexp();

  tokenize(source: string): Array<[string, string, number]> {
    const matchArray = source.matchAll(this.regexp);
    const tokens: Array<[string, string, number]> = [];
    let line = 1;

    for (const match of matchArray) {
      const type = Object.entries(match.groups).filter(
        ([_, value]) => typeof value !== 'undefined',
      )[0][0];
      tokens.push([match[0], type, line]);

      if (type !== Lexer.TOKEN_PHPDOC_EOL) {
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line no-plusplus
      line++;
    }

    tokens.push(['', Lexer.TOKEN_END, line]);
    return tokens;
  }

  private generateRegexp(): RegExp {
    const patterns: { [key: string]: string } = {
      [Lexer.TOKEN_HORIZONTAL_WS]: '[\\x09\\x20]+',
      [Lexer.TOKEN_IDENTIFIER]:
        '(?:[\\\\]?[a-z_\\x80-\\xFF][0-9a-z_\\x80-\\xFF-]*)+',
      [Lexer.TOKEN_THIS_VARIABLE]: '\\$this(?![0-9a-z_\\x80-\\xFF])',
      [Lexer.TOKEN_VARIABLE]: '\\$[a-z_\\x80-\\xFF][0-9a-z_\\x80-\\xFF]*',
      [Lexer.TOKEN_REFERENCE]:
        '&(?=\\s*(?:[.,=)]|(?:\\$(?!this(?![0-9a-z_\\x80-\\xFF])))))',
      [Lexer.TOKEN_UNION]: '\\|',
      [Lexer.TOKEN_INTERSECTION]: '&',
      [Lexer.TOKEN_NULLABLE]: '\\?',
      [Lexer.TOKEN_NEGATED]: '!',
      [Lexer.TOKEN_OPEN_PARENTHESES]: '\\(',
      [Lexer.TOKEN_CLOSE_PARENTHESES]: '\\)',
      [Lexer.TOKEN_OPEN_ANGLE_BRACKET]: '<',
      [Lexer.TOKEN_CLOSE_ANGLE_BRACKET]: '>',
      [Lexer.TOKEN_OPEN_SQUARE_BRACKET]: '\\[',
      [Lexer.TOKEN_CLOSE_SQUARE_BRACKET]: '\\]',
      [Lexer.TOKEN_OPEN_CURLY_BRACKET]: '\\{',
      [Lexer.TOKEN_CLOSE_CURLY_BRACKET]: '\\}',
      [Lexer.TOKEN_COMMA]: ',',
      [Lexer.TOKEN_VARIADIC]: '\\.\\.\\.',
      [Lexer.TOKEN_DOUBLE_COLON]: '::',
      [Lexer.TOKEN_DOUBLE_ARROW]: '=>',
      [Lexer.TOKEN_ARROW]: '->',
      [Lexer.TOKEN_EQUAL]: '=',
      [Lexer.TOKEN_COLON]: ':',
      [Lexer.TOKEN_OPEN_PHPDOC]: '\\/\\*\\*(?=\\s)\\x20?',
      [Lexer.TOKEN_CLOSE_PHPDOC]: '\\*\\/',
      [Lexer.TOKEN_PHPDOC_TAG]: '@(?:[a-z][a-z0-9-\\\\]+:)?[a-z][a-z0-9-\\\\]*',
      [Lexer.TOKEN_PHPDOC_EOL]: '\\r?\\n[\\x09\\x20]*(?:\\*(?!\\/)\\x20?)?',
      [Lexer.TOKEN_FLOAT]:
        '[+-]?(?:(?:[0-9]+(_[0-9]+)*\\.[0-9]*(_[0-9]+)*(?:e[+-]?[0-9]+(_[0-9]+)*)?)|(?:[0-9]*(_[0-9]+)*\\.[0-9]+(_[0-9]+)*(?:e[+-]?[0-9]+(_[0-9]+)*)?)|(?:[0-9]+(_[0-9]+)*e[+-]?[0-9]+(_[0-9]+)*))',
      [Lexer.TOKEN_INTEGER]:
        '[+-]?(?:(?:0b[0-1]+(_[0-1]+)*)|(?:0o[0-7]+(_[0-7]+)*)|(?:0x[0-9a-f]+(_[0-9a-f]+)*)|(?:[0-9]+(_[0-9]+)*))',
      [Lexer.TOKEN_SINGLE_QUOTED_STRING]: "'(?:\\\\[^\\r\\n]|[^'\\r\\n\\\\])*'",
      [Lexer.TOKEN_DOUBLE_QUOTED_STRING]: '"(?:\\\\[^\\r\\n]|[^"\\r\\n\\\\])*"',
      [Lexer.TOKEN_WILDCARD]: '\\*',
    };
    // anything but TOKEN_CLOSE_PHPDOC or TOKEN_HORIZONTAL_WS or TOKEN_EOL
    patterns[Lexer.TOKEN_OTHER] = '(?:(?!\\*\\/)[^\\s])+';
    /* Conversion of foreach loop... */
    // Use Lexer name as backreference key
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Groups_and_backreferences
    const combinedRegExp = Object.entries(patterns)
      .map(([key, pattern]) => {
        return `(?<${key}>${pattern})`;
      })
      .join('|');
    return new RegExp(combinedRegExp, 'sig');
  }
}
