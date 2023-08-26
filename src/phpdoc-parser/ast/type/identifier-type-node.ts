import { TypeNode } from './type-node';

export class IdentifierTypeNode extends TypeNode {
  constructor(public name: string) {
    super();
  }

  public toString(): string {
    return this.name;
  }

  public getNodeType(): string {
    return 'IdentifierTypeNode';
  }
}
