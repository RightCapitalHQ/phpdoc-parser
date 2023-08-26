import { TypeNode } from './type-node';

export class ThisTypeNode extends TypeNode {
  public toString(): string {
    return '$this';
  }

  public getNodeType(): string {
    return 'ThisTypeNode';
  }
}
