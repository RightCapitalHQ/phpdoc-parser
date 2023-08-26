import { NullableTypeNode } from './nullable-type-node';
import { TypeNode } from './type-node';

export class UnionTypeNode extends TypeNode {
  constructor(public types: TypeNode[]) {
    super();
  }

  public toString(): string {
    return `(${this.types
      .map((type) => {
        if (type instanceof NullableTypeNode) {
          return `(${type.toString()})`;
        }

        return type.toString();
      })
      .join(' | ')})`;
  }

  public getNodeType(): string {
    return 'UnionTypeNode';
  }
}
