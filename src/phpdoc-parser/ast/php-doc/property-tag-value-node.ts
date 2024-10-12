import type { TypeNode } from '../type/type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class PropertyTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public propertyName: string,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.type.toString()} ${this.propertyName} ${
      this.description
    }`.trim();
  }

  public getNodeType(): string {
    return 'PropertyTagValueNode';
  }
}
