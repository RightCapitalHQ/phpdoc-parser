import type { TypeNode } from '../type/type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class TemplateTagValueNode extends PhpDocTagValueNode {
  constructor(
    public name: string,
    public bound: TypeNode | null,
    public description: string,
    public defaultTypeNode: TypeNode | null = null,
    public lowerBound: TypeNode | null = null,
  ) {
    super();
  }

  public toString(): string {
    const bound = this.bound !== null ? ` of ${this.bound.toString()}` : '';
    const lowerBoundStr =
      this.lowerBound !== null ? ` super ${this.lowerBound.toString()}` : '';
    const defaultString =
      this.defaultTypeNode !== null
        ? ` = ${this.defaultTypeNode.toString()}`
        : '';
    return `${this.name}${bound}${lowerBoundStr}${defaultString} ${this.description}`.trim();
  }

  public getNodeType(): string {
    return 'TemplateTagValueNode';
  }
}
