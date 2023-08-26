// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Node {
  toString(): string;

  setAttribute(key: string, value: unknown): void;

  hasAttribute(key: string): boolean;

  getAttribute(key: string): unknown;
}
