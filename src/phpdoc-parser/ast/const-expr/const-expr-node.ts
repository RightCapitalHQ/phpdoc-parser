import type { ConstExprArrayItemNode } from './const-expr-array-item-node';
import type { ConstExprArrayNode } from './const-expr-array-node';
import type { ConstExprFalseNode } from './const-expr-false-node';
import type { ConstExprFloatNode } from './const-expr-float-node';
import type { ConstExprIntegerNode } from './const-expr-integer-node';
import type { ConstExprNullNode } from './const-expr-null-node';
import type { ConstExprStringNode } from './const-expr-string-node';
import type { ConstExprTrueNode } from './const-expr-true-node';
import type { ConstFetchNode } from './const-fetch-node';
import type { QuoteAwareConstExprStringNode } from './quote-aware-const-expr-string-node';
import { BaseNode } from '../base-node';

export class ConstExprNode extends BaseNode {
  public getNodeType(): string {
    return 'ConstExprNode';
  }

  public isConstExprFloatNode(): this is ConstExprFloatNode {
    return this.getNodeType() === 'ConstExprFloatNode';
  }

  public isConstFetchNode(): this is ConstFetchNode {
    return this.getNodeType() === 'ConstFetchNode';
  }

  public isConstExprArrayItemNode(): this is ConstExprArrayItemNode {
    return this.getNodeType() === 'ConstExprArrayItemNode';
  }

  public isConstExprFalseNode(): this is ConstExprFalseNode {
    return this.getNodeType() === 'ConstExprFalseNode';
  }

  public isQuoteAwareConstExprStringNode(): this is QuoteAwareConstExprStringNode {
    return this.getNodeType() === 'QuoteAwareConstExprStringNode';
  }

  public isConstExprNullNode(): this is ConstExprNullNode {
    return this.getNodeType() === 'ConstExprNullNode';
  }

  public isConstExprIntegerNode(): this is ConstExprIntegerNode {
    return this.getNodeType() === 'ConstExprIntegerNode';
  }

  public isConstExprNode(): this is ConstExprNode {
    return this.getNodeType() === 'ConstExprNode';
  }

  public isConstExprArrayNode(): this is ConstExprArrayNode {
    return this.getNodeType() === 'ConstExprArrayNode';
  }

  public isConstExprStringNode(): this is ConstExprStringNode {
    return this.getNodeType() === 'ConstExprStringNode';
  }

  public isConstExprTrueNode(): this is ConstExprTrueNode {
    return this.getNodeType() === 'ConstExprTrueNode';
  }
}
