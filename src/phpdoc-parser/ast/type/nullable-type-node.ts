import { TypeNode } from './type-node';

export class NullableTypeNode extends TypeNode {
  constructor(public type: TypeNode) {
    super();
  }

  public toString(): string {
    return `?${this.type.toString()}`;
  }

  public getNodeType(): string {
    return 'NullableTypeNode';
  }
}
