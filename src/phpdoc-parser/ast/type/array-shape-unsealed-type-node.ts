import { TypeNode } from './type-node';

export class ArrayShapeUnsealedTypeNode extends TypeNode {
  constructor(
    public valueType: TypeNode,
    public keyType: TypeNode | null,
  ) {
    super();
  }

  public toString(): string {
    if (this.keyType !== null) {
      return `<${this.keyType.toString()}, ${this.valueType.toString()}>`;
    }
    return `<${this.valueType.toString()}>`;
  }

  public getNodeType(): string {
    return 'ArrayShapeUnsealedTypeNode';
  }
}
