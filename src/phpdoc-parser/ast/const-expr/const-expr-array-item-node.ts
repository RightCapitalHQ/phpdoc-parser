import { ConstExprNode } from './const-expr-node';

export class ConstExprArrayItemNode extends ConstExprNode {
  constructor(
    public key: ConstExprNode | null,
    public value: ConstExprNode,
  ) {
    super();
  }

  public toString(): string {
    if (this.key !== null) {
      return `${this.key.toString()} =>  ${this.value.toString()}`;
    }

    return this.value.toString();
  }

  public getNodeType(): string {
    return 'ConstExprArrayItemNode';
  }
}
