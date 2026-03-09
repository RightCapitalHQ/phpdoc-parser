export class ParserConfig {
  public useLinesAttributes: boolean;

  public useIndexAttributes: boolean;

  public useCommentsAttributes: boolean;

  constructor(
    usedAttributes: {
      lines?: boolean;
      indexes?: boolean;
      comments?: boolean;
    } = {},
  ) {
    this.useLinesAttributes = usedAttributes.lines ?? false;
    this.useIndexAttributes = usedAttributes.indexes ?? false;
    this.useCommentsAttributes = usedAttributes.comments ?? false;
  }
}
