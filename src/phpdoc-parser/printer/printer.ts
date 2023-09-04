import { DiffElemType } from './diff-elem';
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
import { MixinTagValueNode } from '../ast/php-doc/mixin-tag-value-node';
import { ParamOutTagValueNode } from '../ast/php-doc/param-out-tag-value-node';
import { ParamTagValueNode } from '../ast/php-doc/param-tag-value-node';
import { PhpDocNode } from '../ast/php-doc/php-doc-node';
import { PhpDocTagNode } from '../ast/php-doc/php-doc-tag-node';
import { PhpDocTagValueNode } from '../ast/php-doc/php-doc-tag-value-node';
import { PhpDocTextNode } from '../ast/php-doc/php-doc-text-node';
import { PropertyTagValueNode } from '../ast/php-doc/property-tag-value-node';
import { ReturnTagValueNode } from '../ast/php-doc/return-tag-value-node';
import { SelfOutTagValueNode } from '../ast/php-doc/self-out-tag-value-node';
import { TemplateTagValueNode } from '../ast/php-doc/template-tag-value-node';
import { ThrowsTagValueNode } from '../ast/php-doc/throws-tag-value-node';
import { TypeAliasImportTagValueNode } from '../ast/php-doc/type-alias-import-tag-value-node';
import { TypeAliasTagValueNode } from '../ast/php-doc/type-alias-tag-value-node';
import { UsesTagValueNode } from '../ast/php-doc/uses-tag-value-node';
import { VarTagValueNode } from '../ast/php-doc/var-tag-value-node';
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
import { Lexer } from '../lexer/lexer';
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

    let tokenIndex = 0;
    let result;
    // eslint-disable-next-line prefer-const
    [result, tokenIndex] = this.printArrayFormatPreserving(
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

    if (node instanceof MethodTagValueNode) {
      const staticValue = node.isStatic ? 'static ' : '';
      const returnType =
        node.returnType !== null ? `${this.printType(node.returnType)} ` : '';
      const parameters = node.parameters
        .map((parameter: MethodTagValueParameterNode): string => {
          return this.print(parameter);
        })
        .join(', ');
      const description = node.description !== '' ? ` ${node.description}` : '';
      const templateTypes =
        node.templateTypes.length > 0
          ? `<${node.templateTypes
              .map((templateTag: TemplateTagValueNode): string => {
                return this.print(templateTag);
              })
              .join(', ')}>`
          : '';
      return `${staticValue}${returnType}${node.methodName}${templateTypes}(${parameters})${description}`;
    }
    if (node instanceof MixinTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.description}`.trim();
    }
    if (node instanceof ParamOutTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.parameterName} ${node.description}`.trim();
    }
    if (node instanceof ParamTagValueNode) {
      const reference = node.isReference ? '&' : '';
      const variadic = node.isVariadic ? '...' : '';
      const type = this.printType(node.type);
      return `${type} ${reference}${variadic}${node.parameterName} ${node.description}`.trim();
    }

    if (node instanceof PropertyTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.propertyName} ${node.description}`.trim();
    }

    if (node instanceof ReturnTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.description}`.trim();
    }

    if (node instanceof SelfOutTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.description}`.trim();
    }

    if (node instanceof TemplateTagValueNode) {
      const bound =
        node.bound !== null ? ` of ${this.printType(node.bound)}` : '';
      const defaultValue =
        node.defaultTypeNode !== null
          ? ` = ${this.printType(node.defaultTypeNode)}`
          : '';
      return `${node.name}${bound}${defaultValue} ${node.description}`.trim();
    }

    if (node instanceof ThrowsTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.description}`.trim();
    }

    if (node instanceof TypeAliasImportTagValueNode) {
      return `${node.importedAlias} from ${this.printType(
        node.importedFrom,
      )}${(node.importedAs !== null ? ` as ${node.importedAs}` : '').trim()}`;
    }

    if (node instanceof TypeAliasTagValueNode) {
      const type = this.printType(node.type);
      return `${node.alias} ${type}`.trim();
    }

    if (node instanceof UsesTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.description}`.trim();
    }

    if (node instanceof VarTagValueNode) {
      const type = this.printType(node.type);
      return `${type} ${node.variableName} ${node.description}`.trim();
    }

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
    nodes: BaseNode[],
    originalNodes: BaseNode[],
    originalTokens: TokenIterator,
    tokenIndex: number,
    parentNodeClassName: string,
    subNodeName: string,
  ): [string | null, number] {
    const diff = this.differ.diffWithReplacements(originalNodes, nodes);

    const mapKey = `${parentNodeClassName}->${subNodeName}`;
    let insertStr = this.listInsertionMap[mapKey] ?? null;

    let result = '';
    let beforeFirstKeepOrReplace: boolean = true;
    let delayedAdd: BaseNode[] = [];

    let insertNewline: boolean = false;
    const [isMultiline, beforeAsteriskIndent, afterAsteriskIndent] =
      this.isMultiline(tokenIndex, originalNodes, originalTokens);

    if (insertStr === '\n * ') {
      insertStr = `\n${beforeAsteriskIndent}*${afterAsteriskIndent}`;
    }

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < diff.length; i++) {
      const diffElem = diff[i];
      const newNode = diffElem.new;
      const originalNode = diffElem.old;

      if (
        diffElem.type === DiffElemType.KEEP ||
        diffElem.type === DiffElemType.REPLACE
      ) {
        beforeFirstKeepOrReplace = false;

        if (
          !(newNode instanceof BaseNode) ||
          !(originalNode instanceof BaseNode)
        ) {
          return null;
        }

        const itemStartPos = originalNode.getAttribute(
          Attribute.START_INDEX,
        ) as number;
        const itemEndPos = originalNode.getAttribute(
          Attribute.END_INDEX,
        ) as number;

        if (itemStartPos < 0 || itemEndPos < 0 || itemStartPos < tokenIndex) {
          throw new Error('Invalid position');
        }

        result += originalTokens.getContentBetween(tokenIndex, itemStartPos);

        if (delayedAdd.length > 0) {
          for (const delayedNode of delayedAdd) {
            const parenthesesNeeded =
              mapKey in this.parenthesesListMap &&
              this.parenthesesListMap[mapKey].includes(
                // eslint-disable-next-line no-restricted-syntax
                delayedNode.constructor.name,
              );

            if (parenthesesNeeded) {
              result += '(';
            }

            result += this.printNodeFormatPreserving(
              delayedNode,
              originalTokens,
            );

            if (parenthesesNeeded) {
              result += ')';
            }

            if (insertNewline) {
              result += `\n${beforeAsteriskIndent}*${afterAsteriskIndent}`;
            } else {
              result += insertStr;
            }
          }

          delayedAdd = [];
        }

        const parenthesesNeeded =
          // eslint-disable-next-line no-restricted-syntax
          this.parenthesesListMap[mapKey]?.includes(newNode.constructor.name) &&
          !this.parenthesesListMap[mapKey]?.includes(
            // eslint-disable-next-line no-restricted-syntax
            originalNode.constructor.name,
          );

        const addParentheses =
          parenthesesNeeded &&
          !originalTokens.hasParentheses(itemStartPos, itemEndPos);

        if (addParentheses) {
          result += '(';
        }

        result += this.printNodeFormatPreserving(newNode, originalTokens);

        if (addParentheses) {
          result += ')';
        }

        // eslint-disable-next-line no-param-reassign
        tokenIndex = itemEndPos + 1;
      } else if (diffElem.type === DiffElemType.ADD) {
        if (insertStr === null) {
          return null;
        }

        if (!(newNode instanceof BaseNode)) {
          return null;
        }

        if (insertStr === ', ' && isMultiline) {
          insertStr = ',';
          insertNewline = true;
        }

        if (beforeFirstKeepOrReplace) {
          delayedAdd.push(newNode);
          // eslint-disable-next-line no-continue
          continue;
        }

        const itemEndPos = tokenIndex - 1;

        if (insertNewline) {
          result += `${insertStr}\n${beforeAsteriskIndent}*${afterAsteriskIndent}`;
        } else {
          result += insertStr;
        }

        const parenthesesNeeded = this.parenthesesListMap[mapKey]?.includes(
          // eslint-disable-next-line no-restricted-syntax
          newNode.constructor.name,
        );

        if (parenthesesNeeded) {
          result += '(';
        }

        result += this.printNodeFormatPreserving(newNode, originalTokens);

        if (parenthesesNeeded) {
          result += ')';
        }

        // eslint-disable-next-line no-param-reassign
        tokenIndex = itemEndPos + 1;
      } else if (diffElem.type === DiffElemType.REMOVE) {
        if (!(originalNode instanceof BaseNode)) {
          return null;
        }

        const itemStartPos = originalNode.getAttribute(
          Attribute.START_INDEX,
        ) as number;
        const itemEndPos = originalNode.getAttribute(
          Attribute.END_INDEX,
        ) as number;

        if (itemStartPos < 0 || itemEndPos < 0) {
          throw new Error('Invalid index');
        }

        if (i === 0) {
          const originalTokensArray = originalTokens.getTokens();

          // eslint-disable-next-line no-plusplus
          for (let j = tokenIndex; j < itemStartPos; j++) {
            if (
              originalTokensArray[j][Lexer.TYPE_OFFSET] ===
              Lexer.TOKEN_PHPDOC_EOL
            ) {
              break;
            }
            result += originalTokensArray[j][Lexer.VALUE_OFFSET];
          }
        }

        // eslint-disable-next-line no-param-reassign
        tokenIndex = itemEndPos + 1;
      }

      if (delayedAdd.length > 0) {
        if (!(mapKey in this.emptyListInsertionMap)) {
          return null;
        }

        const [findToken, extraLeft, extraRight] =
          this.emptyListInsertionMap[mapKey];

        if (findToken !== null) {
          const originalTokensArray = originalTokens.getTokens();
          // eslint-disable-next-line no-plusplus, no-param-reassign
          for (; tokenIndex < originalTokensArray.length; tokenIndex++) {
            result += originalTokensArray[tokenIndex][Lexer.VALUE_OFFSET];
            if (
              originalTokensArray[tokenIndex][Lexer.VALUE_OFFSET] !== findToken
            ) {
              // eslint-disable-next-line no-continue
              continue;
            }

            // eslint-disable-next-line no-plusplus, no-param-reassign
            tokenIndex++;
            break;
          }
        }
        let isFirst: boolean = true;
        result += extraLeft;
        for (const delayedAddNode of delayedAdd) {
          if (!isFirst) {
            result += insertStr;
            if (insertNewline) {
              result += `${
                originalTokens.getDetectedNewline() ?? '\n'
              }${beforeAsteriskIndent}${afterAsteriskIndent}`;
            }

            result += this.printNodeFormatPreserving(
              delayedAddNode,
              originalTokens,
            );
            isFirst = false;
          }
          result += extraRight;
        }
      }
    }

    return [result, tokenIndex];
  }

  private isMultiline(
    initialIndex: number,
    nodes: Node[],
    originalTokens: TokenIterator,
  ): [boolean, string, string] {
    let isMultiline = nodes.length > 1;
    let pos = initialIndex;
    let allText = '';

    for (const node of nodes) {
      if (!(node instanceof BaseNode)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const endPos = (node.getAttribute(Attribute.END_INDEX) as number) + 1;
      const text = originalTokens.getContentBetween(pos, endPos);
      allText += text;

      if (text.indexOf('\n') === -1) {
        isMultiline = false;
      }

      pos = endPos;
    }

    const matches = allText.matchAll(/\n(\s*)\*(\s*)/g);

    let before = '';
    let after = '';

    for (const match of matches) {
      if (match[1].length > before.length) {
        // eslint-disable-next-line prefer-destructuring
        before = match[1];
      }
      if (match[2].length > after.length) {
        // eslint-disable-next-line prefer-destructuring
        after = match[2];
      }
    }

    return [isMultiline, before, after];
  }

  private printNodeFormatPreserving(
    node: BaseNode,
    originalTokens: TokenIterator,
  ): string {
    const originalNode = node.getAttribute(Attribute.ORIGINAL_NODE) as BaseNode;
    if (!originalNode) {
      return this.print(node);
    }

    // eslint-disable-next-line no-restricted-syntax
    const className = node.constructor.name;
    // eslint-disable-next-line no-restricted-syntax
    if (className !== originalNode.constructor.name) {
      throw new Error('Class name mismatch');
    }

    const startPos = originalNode.getAttribute(Attribute.START_INDEX) as number;
    const endPos = originalNode.getAttribute(Attribute.END_INDEX) as number;

    if (startPos < 0 || endPos < 0) {
      throw new Error('Invalid start or end index');
    }

    let result = '';
    let pos = startPos;

    const subNodeNames = Object.keys(node);

    for (const subNodeName of subNodeNames) {
      const subNode = node[subNodeName] as BaseNode;
      const origSubNode = originalNode[subNodeName] as BaseNode;

      if (
        !(subNode instanceof BaseNode) ||
        !(origSubNode instanceof BaseNode)
      ) {
        if (subNode === origSubNode) {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (Array.isArray(subNode) && Array.isArray(origSubNode)) {
          let listResult;
          [listResult, pos] = this.printArrayFormatPreserving(
            subNode,
            origSubNode,
            originalTokens,
            pos,
            className,
            subNodeName,
          );

          if (listResult === null) {
            return this.print(node);
          }

          result += listResult;
          // eslint-disable-next-line no-continue
          continue;
        }

        return this.print(node);
      }

      const subStartPos = origSubNode.getAttribute(
        Attribute.START_INDEX,
      ) as number;
      const subEndPos = origSubNode.getAttribute(Attribute.END_INDEX) as number;

      if (subStartPos < 0 || subEndPos < 0) {
        throw new Error('Invalid start or end index');
      }

      if (!subNode) {
        return this.print(node);
      }

      result += originalTokens.getContentBetween(pos, subStartPos);

      // eslint-disable-next-line no-restricted-syntax
      const mapKey = `${node.constructor.name}->${subNodeName}`;
      let isParenthesesNeeded: boolean =
        mapKey in this.parenthesesMap &&
        // eslint-disable-next-line no-restricted-syntax
        this.parenthesesMap[mapKey].includes(subNode.constructor.name);

      if (subNode.getAttribute(Attribute.ORIGINAL_NODE) !== null) {
        isParenthesesNeeded =
          isParenthesesNeeded &&
          this.parenthesesMap[mapKey].includes(
            // eslint-disable-next-line no-restricted-syntax
            (subNode.getAttribute(Attribute.ORIGINAL_NODE) as BaseNode)
              .constructor.name,
          );
      }

      const addParentheses =
        isParenthesesNeeded &&
        !originalTokens.hasParentheses(subStartPos, subEndPos);

      if (addParentheses) {
        result += '(';
      }

      result += this.printNodeFormatPreserving(subNode, originalTokens);

      if (addParentheses) {
        result += ')';
      }

      pos = subEndPos + 1;
    }

    return result + originalTokens.getContentBetween(pos, endPos + 1);
  }
}
