import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class TypelessParamTagValueNode extends PhpDocTagValueNode {
  constructor(
    public isVariadic: boolean,
    public parameterName: string,
    public description: string,
    public isReference: boolean = false,
  ) {
    super();
  }

  public toString(): string {
    const reference = this.isReference ? '&' : '';
    const variadic = this.isVariadic ? '...' : '';
    return `${reference}${variadic}${this.parameterName} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'TypelessParamTagValueNode';
  }
}
