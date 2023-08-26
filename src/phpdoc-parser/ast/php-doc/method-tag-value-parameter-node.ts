import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { ConstExprNode } from '../const-expr/const-expr-node';
import { TypeNode } from '../type/type-node';

export class MethodTagValueParameterNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode | null,
    public isReference: boolean,
    public isVariadic: boolean,
    public parameterName: string,
    public defaultValue?: ConstExprNode,
  ) {
    super();
  }

  public toString(): string {
    const type = this.type ? `${this.type} ` : '';
    const isReference = this.isReference ? '&' : '';
    const isVariadic = this.isVariadic ? '...' : '';
    const defaultVal =
      this.defaultValue !== undefined ? ` = ${this.defaultValue}` : '';

    return `${type}${isReference}${isVariadic}${this.parameterName}${defaultVal}`;
  }

  public getNodeType(): string {
    return 'MethodTagValueParameterNode';
  }
}
