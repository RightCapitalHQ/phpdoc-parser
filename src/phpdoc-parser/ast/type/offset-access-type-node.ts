import { CallableTypeNode } from './callable-type-node';
import { ConstTypeNode } from './const-type-node';
import { NullableTypeNode } from './nullable-type-node';
import { TypeNode } from './type-node';

export class OffsetAccessTypeNode extends TypeNode {
  constructor(
    public type: TypeNode,
    public offset: TypeNode,
  ) {
    super();
  }

  public toString(): string {
    if (
      this.type instanceof CallableTypeNode ||
      this.type instanceof ConstTypeNode ||
      this.type instanceof NullableTypeNode
    ) {
      return `(${this.type.toString()})[${this.offset.toString()}]`;
    }

    return `${this.type.toString()}[${this.offset.toString()}]`;
  }

  public getNodeType(): string {
    return 'OffsetAccessTypeNode';
  }
}
