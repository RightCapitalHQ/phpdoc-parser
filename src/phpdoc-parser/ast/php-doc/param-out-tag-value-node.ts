import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { TypeNode } from '../type/type-node';

export class ParamOutTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public parameterName: string,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.type} ${this.parameterName} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'ParamOutTagValueNode';
  }
}
