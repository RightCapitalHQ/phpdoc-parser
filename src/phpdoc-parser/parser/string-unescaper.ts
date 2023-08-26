export class StringUnescaper {
  private static readonly REPLACEMENTS: Record<string, string> = {
    '\\': '\\',
    n: '\n',
    r: '\r',
    t: '\t',
    f: '\f',
    v: '\v',
    e: '\x1B',
  };

  public static unescapeString(input: string): string {
    const quote = input[0];

    if (quote === "'") {
      // eslint-disable-next-line no-useless-escape
      return input.slice(1, input.length - 1).replaceAll(/\\([\\\.])/g, '$1');
    }

    return this.parseEscapeSequences(input.slice(1, input.length - 1), '"');
  }

  // Implementation based on https://github.com/nikic/PHP-Parser/blob/b0edd4c41111042d43bb45c6c657b2e0db367d9e/lib/PhpParser/Node/Scalar/String_.php#L90-L130
  private static parseEscapeSequences(input: string, quote: string): string {
    // eslint-disable-next-line no-param-reassign
    input = input.replaceAll(new RegExp(`\\${quote}`, 'g'), quote);

    return input.replaceAll(
      /\\([\\nrtfve]|[xX][0-9a-fA-F]{1,2}|[0-7]{1,3}|u\{([0-9a-fA-F]+)\})/g,
      (substring, ...matches: string[]) => {
        const firstCaptureGroup = matches[0];

        /**
         * for "\\\n", matches are 0: "n",  1: undefined, 2: 0, 3: "\\n"
         * for "\\\\", matches are 0: "\\", 1: undefined, 2:0, 3: "\\\\"
         */
        if (this.REPLACEMENTS[firstCaptureGroup]) {
          return this.REPLACEMENTS[firstCaptureGroup];
        }

        /**
         * For "\\x21"
         * ------------
         * matches are:
         * [
         *   "x21",
         *   null,
         *   0,
         *   "\\x21"
         * ]
         */
        if (firstCaptureGroup[0] === 'x' || firstCaptureGroup[0] === 'X') {
          return String.fromCharCode(parseInt(firstCaptureGroup.slice(1), 16));
        }

        /**
         * For "\\u{f1f1}"
         * ---------------
         * matches are :
         * [
         *   "u{f1f1}",
         *   "f1f1",
         *   0,
         *   "\\u{f1f1}"
         * ]
         */
        if (firstCaptureGroup[0] === 'u') {
          // TypeScript supports unicode natively, so we use it directly
          return String.fromCharCode(parseInt(matches[1], 16));
        }

        // for "\\237", matches are: 0: "237", 1: undefined, 2:0, 3: "\\237"
        return String.fromCharCode(parseInt(firstCaptureGroup, 8));
      },
    );
  }

  public getType(): string {
    return 'Scalar_String';
  }
}
