import { DeprecatedTagValueNode } from './deprecated-tag-value-node';
import { ExtendsTagValueNode } from './extends-tag-value-node';
import { ImplementsTagValueNode } from './implements-tag-value-node';
import { MixinTagValueNode } from './mixin-tag-value-node';
import { ParamTagValueNode } from './param-tag-value-node';
import type { PhpDocChildNode } from './php-doc-child-node';
import { PhpDocTagNode } from './php-doc-tag-node';
import type { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { ReturnTagValueNode } from './return-tag-value-node';
import { TemplateTagValueNode } from './template-tag-value-node';
import { ThrowsTagValueNode } from './throws-tag-value-node';
import { TypelessParamTagValueNode } from './typeless-param-tag-value-node';
import { UsesTagValueNode } from './uses-tag-value-node';
import { VarTagValueNode } from './var-tag-value-node';
import { BaseNode } from '../base-node';

export class PhpDocNode extends BaseNode {
  constructor(public children: PhpDocChildNode[]) {
    super();
  }

  public getTags(): PhpDocTagNode[] {
    return this.children.filter(
      (child: PhpDocChildNode): child is PhpDocTagNode => {
        return child instanceof PhpDocTagNode;
      },
    );
  }

  public getTagsByName(tagName: string): PhpDocTagNode[] {
    return this.getTags().filter((tag: PhpDocTagNode): boolean => {
      return tag.name === tagName;
    });
  }

  public getVarTagValues(tagName = '@var'): VarTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter((value: PhpDocTagValueNode): value is VarTagValueNode => {
        return value instanceof VarTagValueNode;
      });
  }

  public getParamTagValues(tagName = '@param'): ParamTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter((value: PhpDocTagValueNode): value is ParamTagValueNode => {
        return value instanceof ParamTagValueNode;
      });
  }

  public getTypelessParamTagValues(
    tagName = '@param',
  ): TypelessParamTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is TypelessParamTagValueNode => {
          return value instanceof TypelessParamTagValueNode;
        },
      );
  }

  public getTemplateTagValues(tagName = '@template'): TemplateTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is TemplateTagValueNode =>
          value instanceof TemplateTagValueNode,
      );
  }

  public getExtendsTagValues(tagName = '@extends'): ExtendsTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is ExtendsTagValueNode =>
          value instanceof ExtendsTagValueNode,
      );
  }

  public getImplementsTagValues(
    tagName = '@implements',
  ): ImplementsTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is ImplementsTagValueNode =>
          value instanceof ImplementsTagValueNode,
      );
  }

  public getUsesTagValues(tagName = '@use'): UsesTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is UsesTagValueNode =>
          value instanceof UsesTagValueNode,
      );
  }

  public getReturnTagValues(tagName = '@return'): ReturnTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is ReturnTagValueNode =>
          value instanceof ReturnTagValueNode,
      );
  }

  public getThrowsTagValues(tagName = '@throws'): ThrowsTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is ThrowsTagValueNode =>
          value instanceof ThrowsTagValueNode,
      );
  }

  public getMixinTagValues(tagName = '@mixin'): MixinTagValueNode[] {
    return this.getTagsByName(tagName)
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is MixinTagValueNode =>
          value instanceof MixinTagValueNode,
      );
  }

  public getDeprecatedTagValues(): DeprecatedTagValueNode[] {
    return this.getTagsByName('@deprecated')
      .map((tag) => tag.value)
      .filter(
        (value: PhpDocTagValueNode): value is DeprecatedTagValueNode =>
          value instanceof DeprecatedTagValueNode,
      );
  }

  public getNodeType(): string {
    return 'PhpDocNode';
  }
}
