import { PhpDocChildNode } from './php-doc-child-node';

export class PhpDocTextNode extends PhpDocChildNode {
  constructor(public text: string) {
    super();
  }

  public toString(): string {
    return this.text;
  }

  public getNodeType(): string {
    return 'PhpDocTextNode';
  }
}
