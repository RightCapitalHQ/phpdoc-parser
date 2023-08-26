import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

export class TypeAliasTagValueNode extends PhpDocTagValueNode {
  constructor(
    public alias: string,
    public type: TypeNode,
  ) {
    super();
  }

  public toString(): string {
    return `${this.alias} ${this.type}`.trim();
  }

  public getNodeType(): string {
    return 'TypeAliasTagValueNode';
  }
}
