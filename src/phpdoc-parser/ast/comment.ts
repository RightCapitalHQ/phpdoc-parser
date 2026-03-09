export class Comment {
  public text: string;

  public startLine: number;

  public startIndex: number;

  constructor(text: string, startLine: number = -1, startIndex: number = -1) {
    this.text = text;
    this.startLine = startLine;
    this.startIndex = startIndex;
  }

  getReformattedText(): string {
    return this.text.trim();
  }
}
