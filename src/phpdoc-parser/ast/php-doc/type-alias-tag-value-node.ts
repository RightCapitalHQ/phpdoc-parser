import type { TypeNode } from '../type/type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class TypeAliasTagValueNode extends PhpDocTagValueNode {
  constructor(
    public alias: string,
    public type: TypeNode,
  ) {
    super();
  }

  public toString(): string {
    return `${this.alias} ${this.type.toString()}`.trim();
  }

  public getNodeType(): string {
    return 'TypeAliasTagValueNode';
  }
}
