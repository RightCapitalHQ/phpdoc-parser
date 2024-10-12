import type { TypeNode } from '../type/type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class ReturnTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.type.toString()} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ReturnTagValueNode';
  }
}
