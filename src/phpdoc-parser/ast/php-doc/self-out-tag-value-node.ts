import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

export class SelfOutTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public description: string,
  ) {
    super();
  }

  // Methods need to have explicit modifiers (public in this case)
  public toString(): string {
    return `${this.type} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'SelfOutTagValueNode';
  }
}
