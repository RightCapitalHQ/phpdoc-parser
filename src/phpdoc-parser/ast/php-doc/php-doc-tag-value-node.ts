import { BaseNode } from '../base-node';

export class PhpDocTagValueNode extends BaseNode {
  public getNodeType(): string {
    return 'PhpDocTagValueNode';
  }
}
