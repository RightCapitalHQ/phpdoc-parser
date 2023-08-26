import { TypeNode } from './type-node';

export class CallableTypeParameterNode extends TypeNode {
  constructor(
    public type: TypeNode,
    public isReference: boolean,
    public isVariadic: boolean,
    public parameterName: string,
    public isOptional: boolean,
  ) {
    super();
  }

  public toString(): string {
    const type = `${this.type} `;
    const isReference: string = this.isReference ? '&' : '';
    const isVariadic: string = this.isVariadic ? '...' : '';
    const isOptional: string = this.isOptional ? '=' : '';
    return (
      `${type}${isReference}${isVariadic}${this.parameterName}`.trim() +
      isOptional
    );
  }

  public getNodeType(): string {
    return 'CallableTypeParameterNode';
  }
}
