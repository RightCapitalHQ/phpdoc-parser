import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import type { GenericTypeNode } from '../type/generic-type-node';

export class ImplementsTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: GenericTypeNode,
    public description: string,
  ) {
    super();
  }

  /**
   * Convert to string
   */
  public toString(): string {
    return `${this.type.toString()} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ImplementsTagValueNode';
  }
}
