import { ConstExprNode } from './const-expr-node';

export class ConstExprFalseNode extends ConstExprNode {
  public toString(): string {
    return 'false';
  }

  public getNodeType(): string {
    return 'ConstExprFalseNode';
  }
}
