import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class ParamLaterInvokedCallableTagValueNode extends PhpDocTagValueNode {
  constructor(
    public parameterName: string,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.parameterName} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ParamLaterInvokedCallableTagValueNode';
  }
}
