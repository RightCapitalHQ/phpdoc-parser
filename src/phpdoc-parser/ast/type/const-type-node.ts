import { TypeNode } from './type-node';
import { ConstExprNode } from '../const-expr/const-expr-node';

export class ConstTypeNode extends TypeNode {
  constructor(public constExpr: ConstExprNode) {
    super();
  }

  public toString(): string {
    return this.constExpr.toString();
  }

  public getNodeType(): string {
    return 'ConstTypeNode';
  }
}
