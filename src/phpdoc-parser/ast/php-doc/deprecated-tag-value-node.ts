import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class DeprecatedTagValueNode extends PhpDocTagValueNode {
  constructor(public description: string) {
    super();
  }

  public toString(): string {
    return this.description.trim();
  }

  public getNodeType(): string {
    return 'DeprecatedTagValueNode';
  }
}
