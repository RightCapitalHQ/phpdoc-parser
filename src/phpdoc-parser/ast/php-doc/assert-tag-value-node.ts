import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import type { TypeNode } from '../type/type-node';

export class AssertTagValueNode extends PhpDocTagValueNode {
  // Defining Types -- Types are set explicitly for public variables
  public type: TypeNode;

  public parameter: string;

  public isNegated: boolean;

  public isEquality: boolean;

  public description: string;

  constructor(
    type: TypeNode,
    parameter: string,
    isNegated: boolean,
    description: string,
    isEquality = false,
  ) {
    super();
    this.type = type;
    this.parameter = parameter;
    this.isNegated = isNegated;
    this.isEquality = isEquality;
    this.description = description;
  }

  public toString(): string {
    const isNegated = this.isNegated ? '!' : '';
    const isEquality = this.isEquality ? '=' : '';
    return `${isNegated}${isEquality}${this.type.toString()} ${
      this.parameter
    } ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'AssertTagValueNode';
  }
}
