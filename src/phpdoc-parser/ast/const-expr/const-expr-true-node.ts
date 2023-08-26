import { ConstExprNode } from './const-expr-node';

export class ConstExprTrueNode extends ConstExprNode {
  public toString(): string {
    return 'true';
  }

  public getNodeType(): string {
    return 'ConstExprTrueNode';
  }
}
