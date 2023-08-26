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
    return `(${this.subjectType} ${this.negated ? 'is not' : 'is'} ${
      this.targetType
    } ? ${this.ifType} : ${this.elseType})`;
  }

  public getNodeType(): string {
    return 'ConditionalTypeNode';
  }
}
