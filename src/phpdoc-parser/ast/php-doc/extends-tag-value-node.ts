import type { GenericTypeNode } from '../type/generic-type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class ExtendsTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: GenericTypeNode,
    public description: string = '',
  ) {
    super();
  }

  public toString(): string {
    return `${this.type.toString()} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ExtendsTagValueNode';
  }
}
