import { NullableTypeNode } from './nullable-type-node';
import { TypeNode } from './type-node';

export class IntersectionTypeNode extends TypeNode {
  constructor(public types: TypeNode[]) {
    super();
  }

  public toString(): string {
    return `(${this.types
      .map((type: TypeNode): string => {
        if (type instanceof NullableTypeNode) {
          return `(${type.toString()})`;
        }
        return type.toString();
      })
      .join(' & ')})`;
  }

  public getNodeType(): string {
    return 'IntersectionTypeNode';
  }
}
