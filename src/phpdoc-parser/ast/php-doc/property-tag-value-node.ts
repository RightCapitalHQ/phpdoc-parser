import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

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
