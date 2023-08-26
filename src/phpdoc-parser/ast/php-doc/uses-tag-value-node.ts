// Import statements, adjusted as per your TypeScript project setup
import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { GenericTypeNode } from '../type/generic-type-node';

export class UsesTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: GenericTypeNode,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.type} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'UsesTagValueNode';
  }
}
