import { Differ } from './differ';
import { BaseNode } from '../ast/base-node';
import { ConstExprArrayNode } from '../ast/const-expr/const-expr-array-node';
import { ConstExprNode } from '../ast/const-expr/const-expr-node';
import { Node } from '../ast/node';
import { AssertTagMethodValueNode } from '../ast/php-doc/assert-tag-method-value-node';
import { AssertTagPropertyValueNode } from '../ast/php-doc/assert-tag-property-value-node';
import { AssertTagValueNode } from '../ast/php-doc/assert-tag-value-node';
import { ExtendsTagValueNode } from '../ast/php-doc/extends-tag-value-node';
import { ImplementsTagValueNode } from '../ast/php-doc/implements-tag-value-node';
import { MethodTagValueNode } from '../ast/php-doc/method-tag-value-node';
import { MethodTagValueParameterNode } from '../ast/php-doc/method-tag-value-parameter-node';
import { PhpDocNode } from '../ast/php-doc/php-doc-node';
import { PhpDocTagNode } from '../ast/php-doc/php-doc-tag-node';
import { PhpDocTagValueNode } from '../ast/php-doc/php-doc-tag-value-node';
import { PhpDocTextNode } from '../ast/php-doc/php-doc-text-node';
import { ArrayShapeItemNode } from '../ast/type/array-shape-item-node';
import { ArrayShapeNode } from '../ast/type/array-shape-node';
import { ArrayTypeNode } from '../ast/type/array-type-node';
import { CallableTypeNode } from '../ast/type/callable-type-node';
import { CallableTypeParameterNode } from '../ast/type/callable-type-parameter-node';
import { ConditionalTypeForParameterNode } from '../ast/type/conditional-type-for-parameter-node';
import { ConditionalTypeNode } from '../ast/type/conditional-type-node';
import { ConstTypeNode } from '../ast/type/const-type-node';
import { GenericTypeNode } from '../ast/type/generic-type-node';
import { IdentifierTypeNode } from '../ast/type/identifier-type-node';
import { IntersectionTypeNode } from '../ast/type/intersection-type-node';
import { InvalidTypeNode } from '../ast/type/invalid-type-node';
import { NullableTypeNode } from '../ast/type/nullable-type-node';
import { ObjectShapeItemNode } from '../ast/type/object-shape-item-node';
import { ObjectShapeNode } from '../ast/type/object-shape-node';
import { OffsetAccessTypeNode } from '../ast/type/offset-access-type-node';
import { ThisTypeNode } from '../ast/type/this-type-node';
import { TypeNode } from '../ast/type/type-node';
import { UnionTypeNode } from '../ast/type/union-type-node';
import { Attribute } from '../ast/types';
import { TokenIterator } from '../parser/token-iterator';

export class Printer {
  private differ: Differ<Node>;

  private listInsertionMap: {
    [key: string]: string;
  } = {
    [`${PhpDocNode.name}->children`]: '\n * ',
    [`${UnionTypeNode.name}->types`]: '|',
    [`${IntersectionTypeNode.name}->types`]: '&',
    [`${ArrayShapeNode.name}->items`]: ', ',
    [`${ObjectShapeNode.name}->items`]: ', ',
    [`${CallableTypeNode.name}->parameters`]: ', ',
    [`${GenericTypeNode.name}->genericTypes`]: ', ',
    [`${ConstExprArrayNode.name}->items`]: ', ',
    [`${MethodTagValueNode.name}->parameters`]: ', ',
  };

  private emptyListInsertionMap: {
    [key: string]: [string | null, string, string];
  } = {
    [`${CallableTypeNode.name}->parameters`]: ['(', '', ''],
    [`${ArrayShapeNode.name}->items`]: ['{', '', '}'],
    [`${ObjectShapeNode.name}->items`]: ['{', '', '}'],
  };

  private parenthesesMap: {
    [key: string]: Array<string>;
  } = {
    [`${CallableTypeNode.name}->returnType`]: [
      CallableTypeNode.name,
      UnionTypeNode.name,
      IntersectionTypeNode.name,
    ],

    [`${ArrayTypeNode.name}->type`]: [
      CallableTypeNode.name,
      UnionTypeNode.name,
      IntersectionTypeNode.name,
      ConstTypeNode.name,
      NullableTypeNode.name,
    ],

    [`${OffsetAccessTypeNode.name}->type`]: [
      CallableTypeNode.name,
      UnionTypeNode.name,
      IntersectionTypeNode.name,
      ConstTypeNode.name,
      NullableTypeNode.name,
    ],
  };

  private parenthesesListMap: {
    [key: string]: Array<string>;
  } = {
    [`${IntersectionTypeNode.name}->types`]: [
      IntersectionTypeNode.name,
      UnionTypeNode.name,
      NullableTypeNode.name,
    ],

    [`${UnionTypeNode.name}->types`]: [
      IntersectionTypeNode.name,
      UnionTypeNode.name,
      NullableTypeNode.name,
    ],
  };

  public printFormatPreserving(
    node: PhpDocNode,
    originalNode: PhpDocNode,
    originalTokens: TokenIterator,
  ): string {
    this.differ = new Differ((a, b) => {
      if (a instanceof BaseNode && b instanceof BaseNode) {
        return a === b.getAttribute(Attribute.ORIGINAL_NODE);
      }
      return false;
    });

    const tokenIndex = 0;
    const result = this.printArrayFormatPreserving(
      node.children,
      originalNode.children,
      originalTokens,
      tokenIndex,
      PhpDocNode.name,
      'children',
    );

    if (result !== null) {
      return (
        result +
        originalTokens.getContentBetween(
          tokenIndex,
          originalTokens.getTokenCount(),
        )
      );
    }

    return this.print(node);
  }

  public print(node: BaseNode): string {
    if (node instanceof PhpDocNode) {
      return `/**\n *${node.children
        .map((child) => {
          return ` ${this.print(child)}`;
        })
        .join('\n *')}\n */`;
    }

    if (node instanceof PhpDocTextNode) {
      return node.text;
    }

    if (node instanceof PhpDocTagNode) {
      return `${node.name} ${this.print(node.value)}`.trim();
    }

    if (node instanceof PhpDocTagValueNode) {
      return this.printTagValue(node);
    }

    if (node instanceof TypeNode) {
      return this.printType(node);
    }

    if (node instanceof ConstExprNode) {
      return this.printConstExpr(node);
    }

    if (node instanceof MethodTagValueParameterNode) {
      const type = node.type ? `${this.print(node.type)} ` : '';
      const isReference = node.isReference ? '&' : '';
      const isVariadic = node.isVariadic ? '...' : '';
      const defaultValue =
        node.defaultValue !== null ? ` = ${this.print(node.defaultValue)}` : '';

      return `${type}${isReference}${isVariadic}${node.parameterName}${defaultValue}`;
    }

    if (node instanceof CallableTypeParameterNode) {
      const type = `${this.print(node.type)} `;
      const isReference = node.isReference ? '&' : '';
      const isVariadic = node.isVariadic ? '...' : '';
      const isOptional = node.isOptional ? '=' : '';

      return (
        `${type}${isReference}${isVariadic}${node.parameterName}`.trim() +
        isOptional
      );
    }

    throw new Error(`Unknown node type ${node.getNodeType()}`);
  }

  private printTagValue(node: PhpDocTagValueNode): string {
    if (node instanceof AssertTagMethodValueNode) {
      const isNegated = node.isNegated ? '!' : '';
      const isEquality = node.isEquality ? '=' : '';
      const type = this.printType(node.type);
      return `${isNegated}${isEquality}${type} ${node.parameter}->${node.method}() ${node.description}`.trim();
    }

    if (node instanceof AssertTagPropertyValueNode) {
      const isNegated = node.isNegated ? '!' : '';
      const isEquality = node.isEquality ? '=' : '';
      const type = this.printType(node.type);

      return `${isNegated}${isEquality}${type} ${node.parameter}->${node.property} ${node.description}`.trim();
    }

    if (node instanceof AssertTagValueNode) {
      const isNegated = node.isNegated ? '!' : '';
      const isEquality = node.isEquality ? '=' : '';

      const type = this.printType(node.type);
      return `${isNegated}${isEquality}${type} ${node.parameter} ${node.description}`.trim();
    }

    if (
      node instanceof ExtendsTagValueNode ||
      node instanceof ImplementsTagValueNode
    ) {
      const type = this.printType(node.type);

      return `${type} ${node.description}`.trim();
    }
    // TODO: to be continued....

    return node.toString();
  }

  private printType<T extends TypeNode>(node: T): string {
    if (node instanceof ArrayShapeNode) {
      const items = node.items.map((item: ArrayShapeItemNode) =>
        this.printType(item),
      );

      if (!node.sealed) {
        items.push('...');
      }

      return `${node.kind}{${items.join(', ')}}`;
    }
    if (node instanceof ArrayShapeItemNode) {
      if (node.keyName !== null) {
        return `${this.print(node.keyName)}${
          node.optional ? '?' : ''
        }: ${this.printType(node.valueType)}`;
      }
      return this.printType(node.valueType);
    }
    if (node instanceof ArrayTypeNode) {
      return `${this.printOffsetAccessType(node.type)}[]`;
    }
    if (node instanceof CallableTypeNode) {
      const returnType =
        node.returnType instanceof CallableTypeNode ||
        node.returnType instanceof UnionTypeNode ||
        node.returnType instanceof IntersectionTypeNode
          ? this.wrapInParentheses(node.returnType)
          : this.printType(node.returnType);

      const parameters = node.parameters
        .map((parameter) => this.print(parameter))
        .join(', ');

      return `${node.identifier.toString()}(${parameters}): ${returnType}`;
    }
    if (node instanceof ConditionalTypeForParameterNode) {
      return `(${node.parameterName} ${
        node.negated ? 'is not' : 'is'
      } ${this.printType(node.targetType)} ? ${this.printType(
        node.ifCondition,
      )} : ${this.printType(node.elseCondition)})`;
    }
    if (node instanceof ConditionalTypeNode) {
      return `(${this.printType(node.subjectType)} ${
        node.negated ? 'is not' : 'is'
      } ${this.printType(node.targetType)} ? ${this.printType(
        node.ifType,
      )} : ${this.printType(node.elseType)})`;
    }

    if (node instanceof ConstTypeNode) {
      return this.printConstExpr(node.constExpr);
    }
    if (node instanceof GenericTypeNode) {
      // 处理variance
      const genericTypes = node.genericTypes.map((type, index) => {
        const variance =
          node.variances[index] ?? GenericTypeNode.VARIANCE_INVARIANT;
        if (variance === GenericTypeNode.VARIANCE_INVARIANT) {
          return this.printType(type);
        }
        if (variance === GenericTypeNode.VARIANCE_BIVARIANT) {
          return '*';
        }
        return `${variance} ${this.print(type)}`;
      });

      return `${node.type.toString()}<${genericTypes.join(', ')}>`;
    }
    if (node instanceof IdentifierTypeNode) {
      return node.name;
    }
    if (node instanceof IntersectionTypeNode || node instanceof UnionTypeNode) {
      const items = node.types.map((type) => {
        if (
          type instanceof IntersectionTypeNode ||
          type instanceof UnionTypeNode ||
          type instanceof NullableTypeNode
        ) {
          return this.wrapInParentheses(type);
        }
        return this.printType(type);
      });

      return items.join(node instanceof IntersectionTypeNode ? '&' : '|');
    }
    if (node instanceof InvalidTypeNode) {
      return node.toString();
    }
    if (node instanceof NullableTypeNode) {
      if (
        node.type instanceof IntersectionTypeNode ||
        node.type instanceof UnionTypeNode
      ) {
        return `?(${this.printType(node.type)})`;
      }

      return `?${this.printType(node.type)}`;
    }
    if (node instanceof ObjectShapeNode) {
      const items = node.items.map((item) => this.printType(item));

      return `object{${items.join(', ')}}`;
    }
    if (node instanceof ObjectShapeItemNode) {
      if (node.keyName !== null) {
        return `${this.print(node.keyName)}${
          node.optional ? '?' : ''
        }: ${this.printType(node.valueType)}`;
      }
      return this.printType(node.valueType);
    }
    if (node instanceof OffsetAccessTypeNode) {
      return `${this.printOffsetAccessType(node.type)}[${this.printType(
        node.offset,
      )}]`;
    }
    if (node instanceof ThisTypeNode) {
      return node.toString();
    }

    throw new Error(`Unknown type ${node.getNodeType()}`);
  }

  private wrapInParentheses(node: TypeNode): string {
    return `(${this.printType(node)})`;
  }

  private printOffsetAccessType(type: TypeNode): string {
    if (
      type instanceof CallableTypeNode ||
      type instanceof UnionTypeNode ||
      type instanceof IntersectionTypeNode ||
      type instanceof ConstTypeNode ||
      type instanceof NullableTypeNode
    ) {
      return this.wrapInParentheses(type);
    }

    return this.printType(type);
  }

  private printConstExpr(node: ConstExprNode): string {
    // this is fine - ConstExprNode classes do not contain nodes that need smart printer logic
    return node.toString();
  }

  private printArrayFormatPreserving(
    nodes: Node[],
    originalNodes: Node[],
    originalTokens: TokenIterator,
    tokenIndex: number,
    parentNodeClass: string,
    subNodeName: string,
  ): string | null {
    // ...
  }

  private isMultiline(
    initialIndex: number,
    nodes: Node[],
    originalTokens: TokenIterator,
  ): [boolean, string, string] {
    // ...
  }

  private printNodeFormatPreserving(
    node: Node,
    originalTokens: TokenIterator,
  ): string {
    // ...
  }
}
