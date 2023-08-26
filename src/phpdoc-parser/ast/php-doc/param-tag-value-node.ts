import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

export class ParamTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public isVariadic: boolean,
    public parameterName: string,
    public description: string,
    public isReference: boolean = false,
  ) {
    super();
    this.type = type;
    this.isReference = isReference;
    this.isVariadic = isVariadic;
    this.parameterName = parameterName;
    this.description = description;
  }

  public toString(): string {
    const reference = this.isReference ? '&' : '';
    const variadic = this.isVariadic ? '...' : '';
    return `${this.type.toString()} ${reference}${variadic}${
      this.parameterName
    } ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ParamTagValueNode';
  }
}
