import { TypeNode } from './type-node';

export class ConditionalTypeNode extends TypeNode {
  constructor(
    public subjectType: TypeNode,
    public targetType: TypeNode,
    public ifType: TypeNode,
    public elseType: TypeNode,
    public negated: boolean,
  ) {
    super();
  }

  public toString(): string {
    return `(${this.subjectType.toString()} ${
      this.negated ? 'is not' : 'is'
    } ${this.targetType.toString()} ? ${this.ifType.toString()} : ${this.elseType.toString()})`;
  }

  public getNodeType(): string {
    return 'ConditionalTypeNode';
  }
}
