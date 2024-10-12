import type { TypeNode } from '../type/type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class TemplateTagValueNode extends PhpDocTagValueNode {
  constructor(
    public name: string,
    public bound: TypeNode | null,
    public description: string,
    public defaultTypeNode: TypeNode | null = null,
  ) {
    super();
  }

  public toString(): string {
    const bound = this.bound !== null ? ` of ${this.bound.toString()}` : '';
    const defaultString =
      this.defaultTypeNode !== null
        ? ` = ${this.defaultTypeNode.toString()}`
        : '';
    return `${this.name}${bound}${defaultString} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'TemplateTagValueNode';
  }
}
