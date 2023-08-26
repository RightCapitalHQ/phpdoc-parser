import type { AssertTagMethodValueNode } from './assert-tag-method-value-node';
import type { AssertTagPropertyValueNode } from './assert-tag-property-value-node';
import type { AssertTagValueNode } from './assert-tag-value-node';
import type { DeprecatedTagValueNode } from './deprecated-tag-value-node';
import type { ExtendsTagValueNode } from './extends-tag-value-node';
import type { GenericTagValueNode } from './generic-tag-value-node';
import type { ImplementsTagValueNode } from './implements-tag-value-node';
import type { InvalidTagValueNode } from './invalid-tag-value-node';
import type { MethodTagValueNode } from './method-tag-value-node';
import type { MethodTagValueParameterNode } from './method-tag-value-parameter-node';
import type { MixinTagValueNode } from './mixin-tag-value-node';
import type { ParamOutTagValueNode } from './param-out-tag-value-node';
import type { ParamTagValueNode } from './param-tag-value-node';
import { PhpDocChildNode } from './php-doc-child-node';
import type { PhpDocTagValueNode } from './php-doc-tag-value-node';
import type { PropertyTagValueNode } from './property-tag-value-node';
import type { ReturnTagValueNode } from './return-tag-value-node';
import type { SelfOutTagValueNode } from './self-out-tag-value-node';
import type { TemplateTagValueNode } from './template-tag-value-node';
import type { ThrowsTagValueNode } from './throws-tag-value-node';
import type { TypeAliasImportTagValueNode } from './type-alias-import-tag-value-node';
import type { TypeAliasTagValueNode } from './type-alias-tag-value-node';
import type { TypelessParamTagValueNode } from './typeless-param-tag-value-node';
import type { UsesTagValueNode } from './uses-tag-value-node';
import type { VarTagValueNode } from './var-tag-value-node';

export class PhpDocTagNode extends PhpDocChildNode {
  constructor(
    public name: string,
    public value: PhpDocTagValueNode,
  ) {
    super();
  }

  public toString(): string {
    return `${this.name} ${this.value}`.trim();
  }

  public getNodeType(): string {
    return 'PhpDocTagNode';
  }

  public isParamOutTagValueNode(): this is ParamOutTagValueNode {
    return this.getNodeType() === 'ParamOutTagValueNode';
  }

  public isAssertTagValueNode(): this is AssertTagValueNode {
    return this.getNodeType() === 'AssertTagValueNode';
  }

  public isUsesTagValueNode(): this is UsesTagValueNode {
    return this.getNodeType() === 'UsesTagValueNode';
  }

  public isInvalidTagValueNode(): this is InvalidTagValueNode {
    return this.getNodeType() === 'InvalidTagValueNode';
  }

  public isMethodTagValueNode(): this is MethodTagValueNode {
    return this.getNodeType() === 'MethodTagValueNode';
  }

  public isDeprecatedTagValueNode(): this is DeprecatedTagValueNode {
    return this.getNodeType() === 'DeprecatedTagValueNode';
  }

  public isExtendsTagValueNode(): this is ExtendsTagValueNode {
    return this.getNodeType() === 'ExtendsTagValueNode';
  }

  public isParamTagValueNode(): this is ParamTagValueNode {
    return this.getNodeType() === 'ParamTagValueNode';
  }

  public isGenericTagValueNode(): this is GenericTagValueNode {
    return this.getNodeType() === 'GenericTagValueNode';
  }

  public isTypeAliasTagValueNode(): this is TypeAliasTagValueNode {
    return this.getNodeType() === 'TypeAliasTagValueNode';
  }

  public isAssertTagPropertyValueNode(): this is AssertTagPropertyValueNode {
    return this.getNodeType() === 'AssertTagPropertyValueNode';
  }

  public isTypelessParamTagValueNode(): this is TypelessParamTagValueNode {
    return this.getNodeType() === 'TypelessParamTagValueNode';
  }

  public isVarTagValueNode(): this is VarTagValueNode {
    return this.getNodeType() === 'VarTagValueNode';
  }

  public isMethodTagValueParameterNode(): this is MethodTagValueParameterNode {
    return this.getNodeType() === 'MethodTagValueParameterNode';
  }

  public isAssertTagMethodValueNode(): this is AssertTagMethodValueNode {
    return this.getNodeType() === 'AssertTagMethodValueNode';
  }

  public isTemplateTagValueNode(): this is TemplateTagValueNode {
    return this.getNodeType() === 'TemplateTagValueNode';
  }

  public isImplementsTagValueNode(): this is ImplementsTagValueNode {
    return this.getNodeType() === 'ImplementsTagValueNode';
  }

  public isThrowsTagValueNode(): this is ThrowsTagValueNode {
    return this.getNodeType() === 'ThrowsTagValueNode';
  }

  public isSelfOutTagValueNode(): this is SelfOutTagValueNode {
    return this.getNodeType() === 'SelfOutTagValueNode';
  }

  public isPropertyTagValueNode(): this is PropertyTagValueNode {
    return this.getNodeType() === 'PropertyTagValueNode';
  }

  public isTypeAliasImportTagValueNode(): this is TypeAliasImportTagValueNode {
    return this.getNodeType() === 'TypeAliasImportTagValueNode';
  }

  public isMixinTagValueNode(): this is MixinTagValueNode {
    return this.getNodeType() === 'MixinTagValueNode';
  }

  public isPhpDocTagValueNode(): this is PhpDocTagValueNode {
    return this.getNodeType() === 'PhpDocTagValueNode';
  }

  public isReturnTagValueNode(): this is ReturnTagValueNode {
    return this.getNodeType() === 'ReturnTagValueNode';
  }
}
