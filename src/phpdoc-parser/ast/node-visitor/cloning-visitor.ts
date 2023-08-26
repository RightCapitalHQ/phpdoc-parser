import { cloneDeep } from 'lodash';
import { AbstractNodeVisitor } from '../abstract-node-visitor';
import { Node } from '../node';
import { Attribute } from '../types';

export class CloningVisitor extends AbstractNodeVisitor {
  public enterNode(originalNode: Node) {
    const node = cloneDeep(originalNode);
    node.setAttribute(Attribute.ORIGINAL_NODE, originalNode);

    return node;
  }
}
