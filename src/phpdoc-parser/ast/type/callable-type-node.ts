import { CallableTypeParameterNode } from './callable-type-parameter-node';
import { IdentifierTypeNode } from './identifier-type-node';
import { TypeNode } from './type-node';

export class CallableTypeNode extends TypeNode {
  constructor(
    public identifier: IdentifierTypeNode,
    public parameters: CallableTypeParameterNode[],
    public returnType: TypeNode,
  ) {
    super();
  }

  public toString(): string {
    let { returnType }: { returnType: TypeNode | string } = this;
    if (returnType instanceof CallableTypeNode) {
      returnType = `(${returnType.toString()})`;
    }
    const parameters = this.parameters.join(', ');
    return `${this.identifier.toString()}(${parameters}): ${returnType.toString()}`;
  }

  public getNodeType(): string {
    return 'CallableTypeNode';
  }
}
