import type { ConstExprIntegerNode } from '../const-expr/const-expr-integer-node';
import type { ConstExprStringNode } from '../const-expr/const-expr-string-node';
import type { IdentifierTypeNode } from './identifier-type-node';
import { TypeNode } from './type-node';

export class ArrayShapeItemNode extends TypeNode {
  constructor(
    public keyName:
      | ConstExprIntegerNode
      | ConstExprStringNode
      | IdentifierTypeNode
      | null,
    public optional: boolean,
    public valueType: TypeNode,
  ) {
    super();
  }

  public toString(): string {
    if (this.keyName !== null) {
      return `${String(this.keyName)}${this.optional ? '?' : ''}: ${String(
        this.valueType,
      )}`;
    }

    return String(this.valueType);
  }

  public getNodeType(): string {
    return 'ArrayShapeItemNode';
  }
}
