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
      returnType = `(${returnType})`;
    }
    const parameters = this.parameters.join(', ');
    return `${this.identifier}(${parameters}): ${returnType}`;
  }

  public getNodeType(): string {
    return 'CallableTypeNode';
  }
}
