import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class GenericTagValueNode extends PhpDocTagValueNode {
  constructor(public value: string) {
    super();
  }

  public toString(): string {
    return this.value;
  }

  public getNodeType(): string {
    return 'GenericTagValueNode';
  }
}
