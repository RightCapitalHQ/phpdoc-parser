import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

export class AssertTagPropertyValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public parameter: string,
    public property: string,
    public isNegated: boolean,
    public description: string,
    public isEquality: boolean = false,
  ) {
    super();
  }

  public toString(): string {
    const isNegated = this.isNegated ? '!' : '';
    const isEquality = this.isEquality ? '=' : '';
    return `${isNegated}${isEquality}${this.type} ${this.parameter}->${this.property} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'AssertTagPropertyValueNode';
  }
}
