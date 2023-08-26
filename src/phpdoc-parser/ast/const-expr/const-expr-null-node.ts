import { ConstExprNode } from './const-expr-node';

export class ConstExprNullNode extends ConstExprNode {
  public toString(): string {
    return 'null';
  }

  public getNodeType(): string {
    return 'ConstExprNullNode';
  }
}
