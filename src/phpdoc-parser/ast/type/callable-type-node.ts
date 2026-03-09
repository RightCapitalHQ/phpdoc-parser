import type { TemplateTagValueNode } from '../php-doc/template-tag-value-node';
import type { CallableTypeParameterNode } from './callable-type-parameter-node';
import type { IdentifierTypeNode } from './identifier-type-node';
import { TypeNode } from './type-node';

export class CallableTypeNode extends TypeNode {
  constructor(
    public identifier: IdentifierTypeNode,
    public parameters: CallableTypeParameterNode[],
    public returnType: TypeNode,
    public templateTypes: TemplateTagValueNode[] = [],
  ) {
    super();
  }

  public toString(): string {
    let { returnType }: { returnType: TypeNode | string } = this;
    if (returnType instanceof CallableTypeNode) {
      returnType = `(${returnType.toString()})`;
    }
    const template = this.templateTypes.length > 0 ? `<${this.templateTypes.join(', ')}>` : '';
    const parameters = this.parameters.join(', ');
    return `${this.identifier.toString()}${template}(${parameters}): ${returnType.toString()}`;
  }

  public getNodeType(): string {
    return 'CallableTypeNode';
  }
}
