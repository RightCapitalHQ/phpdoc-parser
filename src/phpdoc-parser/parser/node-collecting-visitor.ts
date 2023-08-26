import { AbstractNodeVisitor } from '../ast/abstract-node-visitor';
import { Node } from '../ast/node';
import { NodeTraverserEnterReturn } from '../ast/node-visitor';

export class NodeCollectingVisitor extends AbstractNodeVisitor {
  public nodes: Array<Node> = [];

  public enterNode(node: Node): NodeTraverserEnterReturn {
    this.nodes.push(node);

    return null;
  }
}
