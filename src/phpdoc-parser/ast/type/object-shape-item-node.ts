import type { IdentifierTypeNode } from './identifier-type-node';
import { TypeNode } from './type-node';
import type { ConstExprStringNode } from '../const-expr/const-expr-string-node';

export class ObjectShapeItemNode extends TypeNode {
  constructor(
    public keyName: ConstExprStringNode | IdentifierTypeNode,
    public optional: boolean,
    public valueType: TypeNode,
  ) {
    super();
  }

  public toString(): string {
    if (this.keyName !== null) {
      return `${this.keyName.toString()}${
        this.optional ? '?' : ''
      }: ${this.valueType.toString()}`;
    }

    return this.valueType.toString();
  }

  public getNodeType(): string {
    return 'ObjectShapeItemNode';
  }
}
