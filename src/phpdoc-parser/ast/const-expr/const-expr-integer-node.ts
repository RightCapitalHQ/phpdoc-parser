import { ConstExprNode } from './const-expr-node';

export class ConstExprIntegerNode extends ConstExprNode {
  constructor(public value: string) {
    super();
  }

  public toString(): string {
    return this.value;
  }

  public getNodeType(): string {
    return 'ConstExprIntegerNode';
  }
}
