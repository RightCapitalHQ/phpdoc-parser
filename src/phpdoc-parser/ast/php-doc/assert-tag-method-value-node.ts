import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import type { TypeNode } from '../type/type-node';

export class AssertTagMethodValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public parameter: string,
    public method: string,
    public isNegated: boolean,
    public description: string,
    public isEquality: boolean = false,
  ) {
    super();
  }

  public toString(): string {
    const isNegated = this.isNegated ? '!' : '';
    const isEquality = this.isEquality ? '=' : '';
    return `${isNegated}${isEquality}${this.type.toString()} ${
      this.parameter
    }->${this.method}() ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'AssertTagMethodValueNode';
  }
}
