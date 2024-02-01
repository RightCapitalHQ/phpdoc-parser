import type { ConstExprArrayItemNode } from './const-expr-array-item-node';
import { ConstExprNode } from './const-expr-node';

export class ConstExprArrayNode extends ConstExprNode {
  constructor(public items: ConstExprArrayItemNode[]) {
    super();
  }

  public toString(): string {
    return `[${this.items.join(',')}]`;
  }

  public getNodeType(): string {
    return 'ConstExprArrayNode';
  }
}
