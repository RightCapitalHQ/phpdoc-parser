import { PhpDocChildNode } from './php-doc-child-node';
import type { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class PhpDocTagNode extends PhpDocChildNode {
  constructor(
    public name: string,
    public value: PhpDocTagValueNode,
  ) {
    super();
  }

  public toString(): string {
    return `${this.name} ${this.value.toString()}`.trim();
  }

  public getNodeType(): string {
    return 'PhpDocTagNode';
  }
}
