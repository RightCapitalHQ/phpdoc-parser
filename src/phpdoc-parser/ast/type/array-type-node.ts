import { CallableTypeNode } from './callable-type-node';
import { ConstTypeNode } from './const-type-node';
import { NullableTypeNode } from './nullable-type-node';
import { TypeNode } from './type-node';

export class ArrayTypeNode extends TypeNode {
  constructor(public type: TypeNode) {
    super();
  }

  public toString(): string {
    if (
      this.type instanceof CallableTypeNode ||
      this.type instanceof ConstTypeNode ||
      this.type instanceof NullableTypeNode
    ) {
      return `(${this.type.toString()})[]`;
    }

    return `${this.type.toString()}[]`;
  }

  public getNodeType(): string {
    return 'ArrayTypeNode';
  }
}
