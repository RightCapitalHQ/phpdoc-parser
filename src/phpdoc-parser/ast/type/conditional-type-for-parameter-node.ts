import { TypeNode } from './type-node';

export class ConditionalTypeForParameterNode extends TypeNode {
  constructor(
    public parameterName: string,
    public targetType: TypeNode,
    public ifCondition: TypeNode,
    public elseCondition: TypeNode,
    public negated: boolean,
  ) {
    super();
  }

  public toString(): string {
    return `(${this.parameterName} ${
      this.negated ? 'is not' : 'is'
    } ${this.targetType.toString()} ? ${this.ifCondition.toString()} : ${this.elseCondition.toString()})`;
  }

  public getNodeType(): string {
    return 'ConditionalTypeForParameterNode';
  }
}
