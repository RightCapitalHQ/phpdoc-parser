import type { TypeNode } from '../type/type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class VarTagValueNode extends PhpDocTagValueNode {
  constructor(
    public type: TypeNode,
    public variableName: string,
    public description: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.type.toString()} ${this.variableName} ${
      this.description
    }`.trim();
  }

  public getNodeType(): string {
    return 'VarTagValueNode';
  }
}
