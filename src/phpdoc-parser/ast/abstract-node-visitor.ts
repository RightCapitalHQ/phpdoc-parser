import type { Node } from './node';
import type {
  NodeTraverserBeforeAfterReturn,
  NodeTraverserEnterReturn,
  NodeTraverserLeaveReturn,
  NodeVisitor,
} from './node-visitor';

export abstract class AbstractNodeVisitor implements NodeVisitor {
  public beforeTraverse(_nodes: Node[]): NodeTraverserBeforeAfterReturn {
    return null;
  }

  public enterNode(_node: Node): NodeTraverserEnterReturn {
    return null;
  }

  public leaveNode(_node: Node): NodeTraverserLeaveReturn {
    return null;
  }

  public afterTraverse(_nodes: Node[]): NodeTraverserBeforeAfterReturn {
    return null;
  }
}
