import type { Node } from './node';

export abstract class BaseNode implements Node {
  private attributes: { [key: string]: unknown } = {};

  public setAttribute(key: string, value: unknown): void {
    this.attributes[key] = value;
  }

  public hasAttribute(key: string): boolean {
    // eslint-disable-next-line no-prototype-builtins
    return this.attributes.hasOwnProperty(key);
  }

  public getAttribute(key: string): unknown {
    if (this.hasAttribute(key)) {
      return this.attributes[key];
    }
    return null;
  }

  public toString(): string {
    throw new Error('Not yet implemented');
  }

  /**
   * For better JSON.stringify support,
   * `toJSON()` is responsible to define what data will be serialized
   * Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description
   *
   * PHP Parser has similar method like `jsonSerialize()`
   * Ref: https://github.com/nikic/PHP-Parser/blob/19526a33fb561ef417e822e85f08a00db4059c17/lib/PhpParser/NodeAbstract.php#L172-L177
   */
  public toJSON(): object {
    return {
      nodeType: this.getNodeType(),
      ...this,
    };
  }

  public abstract getNodeType(): string;
}
