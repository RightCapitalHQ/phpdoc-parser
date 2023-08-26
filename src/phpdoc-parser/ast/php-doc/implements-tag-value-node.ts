import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { GenericTypeNode } from '../type/generic-type-node';

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
    return `${this.type} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ImplementsTagValueNode';
  }
}
