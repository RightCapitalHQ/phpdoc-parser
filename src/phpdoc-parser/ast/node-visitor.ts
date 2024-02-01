/**
 * Inspired by https://github.com/nikic/PHP-Parser/tree/36a6dcd04e7b0285e8f0868f44bd4927802f7df1
 *
 * Copyright (c) 2011, Nikita Popov
 * All rights reserved.
 */

import type { Node } from './node';
import type { NodeTraverserState } from './types';

export type NodeTraverserEnterReturn =
  | Node
  | Node[]
  | null
  | NodeTraverserState;
export type NodeTraverserLeaveReturn =
  | Node
  | Node[]
  | null
  | NodeTraverserState.REMOVE_NODE
  | NodeTraverserState.STOP_TRAVERSAL;
export type NodeTraverserBeforeAfterReturn = Node[] | null;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface NodeVisitor {
  /**
   * Called once before traversal.
   *
   *  * null:      $nodes stays as-is
   *  * otherwise: $nodes is set to the return value
   *
   * @param nodes Array of nodes
   *
   * @return Array of nodes or null
   */
  beforeTraverse(nodes: Node[]): NodeTraverserBeforeAfterReturn;

  /**
   * Called when entering a node.
   *
   * Return value semantics:
   *  null
   *        => Node stays as-is
   *  array (of Nodes)
   *        => The return value is merged into the parent array (at the position of the node)
   *  NodeTraverser::REMOVE_NODE
   *        => $node is removed from the parent array
   *  NodeTraverser::DONT_TRAVERSE_CHILDREN
   *        => Children of $node are not traversed. $node stays as-is
   *  NodeTraverser::DONT_TRAVERSE_CURRENT_AND_CHILDREN
   *        => Further visitors for the current node are skipped, and its children are not
   *           traversed. $node stays as-is.
   *  NodeTraverser::STOP_TRAVERSAL
   *        => Traversal is aborted. $node stays as-is
   *  otherwise
   *        => node is set to the return value
   *
   * @param node Node
   *
   * @return NodeTraverserEnterReturn Replacement node (or special return value)
   */
  enterNode(node: Node): NodeTraverserEnterReturn;

  /**
   * Called when leaving a node.
   *
   * Return value semantics:
   *  null
   *      => node stays as-is
   *  NodeTraverser::REMOVE_NODE
   *      => $node is removed from the parent array
   *  NodeTraverser::STOP_TRAVERSAL
   *      => Traversal is aborted. $node stays as-is
   *  array (of Nodes)
   *      => The return value is merged into the parent array (at the position of the node)
   *  otherwise
   *      => node is set to the return value
   *
   * @param node Node
   *
   * @return Replacement node (or special return value)
   */
  leaveNode(node: Node): NodeTraverserLeaveReturn;

  /**
   * Called once after traversal.
   *
   *  * null:      nodes stays as-is
   *  * otherwise: nodes is set to the return value
   *
   * @param nodes Array of nodes
   *
   * @return Array of nodes or null
   */
  afterTraverse(nodes: Node[]): NodeTraverserBeforeAfterReturn;
}
