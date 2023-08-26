import { BaseNode } from '../base-node';

export class PhpDocChildNode extends BaseNode {
  public getNodeType(): string {
    return 'PhpDocChildNode';
  }
}
