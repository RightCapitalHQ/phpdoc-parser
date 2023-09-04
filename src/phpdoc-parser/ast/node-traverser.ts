/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
import { BaseNode } from './base-node';
import { ConstExprNode } from './const-expr/const-expr-node';
import { Node } from './node';
import { NodeVisitor } from './node-visitor';
import { PhpDocChildNode } from './php-doc/php-doc-child-node';
import { PhpDocTagValueNode } from './php-doc/php-doc-tag-value-node';
import { TypeNode } from './type/type-node';
import { NodeTraverserState } from './types';

export class NodeTraverser {
  /** Visitors */
  private visitors: NodeVisitor[];

  /** Whether traversal should be stopped */
  private stopTraversal: boolean;

  constructor(visitors: NodeVisitor[]) {
    this.visitors = visitors;
  }

  /**
   * Traverses an array of nodes using the registered visitors.
   *
   * @param nodes Array of nodes
   *
   * @return Traversed array of nodes
   */
  public traverse(nodes: Node[]): Node[] {
    this.stopTraversal = false;

    for (const visitor of this.visitors) {
      const returned = visitor.beforeTraverse(nodes);
      if (returned !== null) {
        // eslint-disable-next-line no-param-reassign
        nodes = returned;
      }
    }

    // eslint-disable-next-line no-param-reassign
    nodes = this.traverseArray(nodes);

    for (const visitor of this.visitors) {
      const returned = visitor.afterTraverse(nodes);
      if (returned !== null) {
        // eslint-disable-next-line no-param-reassign
        nodes = returned;
      }
    }

    return nodes;
  }

  /**
   * Recursively traverse a node.
   *
   * @param node Node to traverse.
   *
   * @return Node Result of traversal (may be original node or new one)
   */
  private traverseNode(node: Node): Node {
    const subNodeNames = Object.keys(node);

    for (const name of subNodeNames) {
      if (name === 'attributes') {
        continue;
      }

      let subNode = node[name] as Node | Node[];

      if (Array.isArray(subNode)) {
        subNode = this.traverseArray(subNode);
        if (this.stopTraversal) {
          break;
        }
      } else if (subNode instanceof BaseNode) {
        let traverseChildren = true;
        let breakVisitorIndex = null;

        for (
          let visitorIndex = 0;
          visitorIndex < this.visitors.length;
          ++visitorIndex
        ) {
          const visitor = this.visitors[visitorIndex];
          const enterNodeResult = visitor.enterNode(subNode);
          if (enterNodeResult === null) {
            continue;
          }

          switch (enterNodeResult) {
            case NodeTraverserState.DONT_TRAVERSE_CHILDREN:
              traverseChildren = false;
              break;
            case NodeTraverserState.DONT_TRAVERSE_CURRENT_AND_CHILDREN:
              traverseChildren = false;
              breakVisitorIndex = visitorIndex;
              break;
            case NodeTraverserState.STOP_TRAVERSAL:
              this.stopTraversal = true;
              break;
            default:
              if (enterNodeResult instanceof BaseNode) {
                this.ensureReplacementReasonable(subNode, enterNodeResult);
                subNode = enterNodeResult;
              } else {
                throw new Error(
                  `enterNode() returned invalid value of type ${typeof enterNodeResult}: value=${JSON.stringify(
                    enterNodeResult,
                    undefined,
                    2,
                  )}`,
                );
              }
          }

          if (this.stopTraversal) {
            break;
          }
        }

        if (traverseChildren) {
          subNode = this.traverseNode(subNode);
          if (this.stopTraversal) {
            break;
          }
        }

        for (
          let visitorIndex = 0;
          visitorIndex < this.visitors.length;
          ++visitorIndex
        ) {
          const visitor = this.visitors[visitorIndex];
          const leaveNodeResult = visitor.leaveNode(subNode);

          if (leaveNodeResult != null) {
            if (leaveNodeResult instanceof BaseNode) {
              this.ensureReplacementReasonable(subNode, leaveNodeResult);
              subNode = leaveNodeResult;
            } else if (leaveNodeResult === NodeTraverserState.STOP_TRAVERSAL) {
              this.stopTraversal = true;
              break;
            } else if (Array.isArray(leaveNodeResult)) {
              throw new Error(
                'leaveNode() may only return an array ' +
                  'if the parent structure is an array',
              );
            } else {
              throw new Error(
                `leaveNode() returned invalid value of type ${typeof leaveNodeResult}`,
              );
            }
          }

          if (breakVisitorIndex === visitorIndex) {
            break;
          }
        }
      }

      // eslint-disable-next-line no-param-reassign
      node[name] = subNode;
    }

    return node;
  }

  private traverseArray(nodes: Node[]): Node[] {
    const doNodes: [number, Node[]][] = [];

    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (node instanceof BaseNode) {
        let traverseChildren = true;
        let breakVisitorIndex = null;

        for (
          let visitorIndex = 0;
          visitorIndex < this.visitors.length;
          visitorIndex++
        ) {
          const visitor = this.visitors[visitorIndex];
          const returnVal = visitor.enterNode(node);

          if (returnVal === null) {
            continue;
          }

          if (returnVal instanceof BaseNode) {
            // Assuming 'Node' type is defined somewhere
            this.ensureReplacementReasonable(node, returnVal); // Assuming this function is defined somewhere
            node = returnVal;
          } else if (Array.isArray(returnVal)) {
            doNodes.push([i, returnVal]);
            continue;
          } else if (returnVal === NodeTraverserState.REMOVE_NODE) {
            doNodes.push([i, []]);
            continue;
          } else if (returnVal === NodeTraverserState.DONT_TRAVERSE_CHILDREN) {
            traverseChildren = false;
          } else if (
            returnVal === NodeTraverserState.DONT_TRAVERSE_CURRENT_AND_CHILDREN
          ) {
            traverseChildren = false;
            breakVisitorIndex = visitorIndex;
            break;
          } else if (returnVal === NodeTraverserState.STOP_TRAVERSAL) {
            this.stopTraversal = true;
            break;
          } else {
            throw new Error(
              `enterNode returned invalid value of type ${typeof returnVal}`,
            );
          }
        }

        if (traverseChildren) {
          node = this.traverseNode(node); // Assuming this function is defined somewhere
          if (this.stopTraversal) {
            break;
          }
        }

        for (
          let visitorIndex = 0;
          visitorIndex < this.visitors.length;
          visitorIndex++
        ) {
          const visitor = this.visitors[visitorIndex];
          const returnVal = visitor.leaveNode(node);

          if (returnVal !== null) {
            if (returnVal instanceof BaseNode) {
              // Assuming 'Node' type is defined somewhere
              this.ensureReplacementReasonable(node, returnVal); // Assuming this function is defined somewhere
              node = returnVal;
            } else if (Array.isArray(returnVal)) {
              doNodes.push([i, returnVal]);
              break;
            } else if (returnVal === NodeTraverserState.REMOVE_NODE) {
              doNodes.push([i, []]);
              break;
            } else if (returnVal === NodeTraverserState.STOP_TRAVERSAL) {
              this.stopTraversal = true;
              break;
            } else {
              throw new Error(
                `leaveNode returned invalid value of type ${typeof returnVal}`,
              );
            }
          }

          if (breakVisitorIndex === visitorIndex) {
            break;
          }
        }
      } else if (Array.isArray(node)) {
        throw new Error('Invalid node structure: Contains nested arrays');
      }
    }

    if (doNodes.length > 0) {
      while (doNodes.length > 0) {
        const [i, replace] = doNodes.pop();
        // eslint-disable-next-line no-param-reassign
        nodes = [...nodes.slice(0, i), ...replace, ...nodes.slice(i + 1)];
      }
    }

    return nodes;
  }

  private ensureReplacementReasonable(old: Node, newNode: Node): void {
    if (old instanceof TypeNode && !(newNode instanceof TypeNode)) {
      throw new Error(
        // eslint-disable-next-line no-restricted-syntax
        `Trying to replace TypeNode with ${newNode.constructor.name}`,
      );
    }
    if (old instanceof ConstExprNode && !(newNode instanceof ConstExprNode)) {
      throw new Error(
        // eslint-disable-next-line no-restricted-syntax
        `Trying to replace ConstExprNode with ${newNode.constructor.name}`,
      );
    }
    if (
      old instanceof PhpDocChildNode &&
      !(newNode instanceof PhpDocChildNode)
    ) {
      throw new Error(
        // eslint-disable-next-line no-restricted-syntax
        `Trying to replace PhpDocChildNode with ${newNode.constructor.name}`,
      );
    }
    if (
      old instanceof PhpDocTagValueNode &&
      !(newNode instanceof PhpDocTagValueNode)
    ) {
      throw new Error(
        // eslint-disable-next-line no-restricted-syntax
        `Trying to replace PhpDocTagValueNode with ${newNode.constructor.name}`,
      );
    }
  }
}
