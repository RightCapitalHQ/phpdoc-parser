import { ConstExprNode } from './const-expr-node';

export class ConstExprStringNode extends ConstExprNode {
  constructor(public value: string) {
    super();
  }

  public toString(): string {
    return this.value;
  }

  public getNodeType(): string {
    return 'ConstExprStringNode';
  }
}
