import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

export class MixinTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.type} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'MixinTagValueNode';
  }
}
