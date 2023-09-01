import { MethodTagValueParameterNode } from './method-tag-value-parameter-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TemplateTagValueNode } from './template-tag-value-node';
import { TypeNode } from '../type/type-node';

export class MethodTagValueNode extends PhpDocTagValueNode {
  constructor(
    public isStatic: boolean,
    public returnType: TypeNode | null,
    public methodName: string,
    public parameters: MethodTagValueParameterNode[],
    public description: string,
    public templateTypes: TemplateTagValueNode[],
  ) {
    super();
  }

  public toString(): string {
    const staticKeyword = this.isStatic ? 'static ' : '';
    const returnTypeStr =
      this.returnType !== null ? `${this.returnType.toString()} ` : '';
    const parametersStr = this.parameters.join(', ');
    const descriptionStr =
      this.description !== '' ? ` ${this.description}` : '';
    const templateTypesStr =
      this.templateTypes.length > 0 ? `<${this.templateTypes.join(', ')}>` : '';
    return `${staticKeyword}${returnTypeStr}${this.methodName}${templateTypesStr}(${parametersStr})${descriptionStr}`;
  }

  public getNodeType(): string {
    return 'MethodTagValueNode';
  }
}
