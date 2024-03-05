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

export const isParamOutTagValueNode = (
  node: PhpDocTagValueNode,
): node is ParamOutTagValueNode => {
  return node.getNodeType() === 'ParamOutTagValueNode';
};

export const isAssertTagValueNode = (
  node: PhpDocTagValueNode,
): node is AssertTagValueNode => {
  return node.getNodeType() === 'AssertTagValueNode';
};

export const isUsesTagValueNode = (
  node: PhpDocTagValueNode,
): node is UsesTagValueNode => {
  return node.getNodeType() === 'UsesTagValueNode';
};

export const isInvalidTagValueNode = (
  node: PhpDocTagValueNode,
): node is InvalidTagValueNode => {
  return node.getNodeType() === 'InvalidTagValueNode';
};

export const isMethodTagValueNode = (
  node: PhpDocTagValueNode,
): node is MethodTagValueNode => {
  return node.getNodeType() === 'MethodTagValueNode';
};

export const isDeprecatedTagValueNode = (
  node: PhpDocTagValueNode,
): node is DeprecatedTagValueNode => {
  return node.getNodeType() === 'DeprecatedTagValueNode';
};

export const isExtendsTagValueNode = (
  node: PhpDocTagValueNode,
): node is ExtendsTagValueNode => {
  return node.getNodeType() === 'ExtendsTagValueNode';
};

export const isParamTagValueNode = (
  node: PhpDocTagValueNode,
): node is ParamTagValueNode => {
  return node.getNodeType() === 'ParamTagValueNode';
};

export const isGenericTagValueNode = (
  node: PhpDocTagValueNode,
): node is GenericTagValueNode => {
  return node.getNodeType() === 'GenericTagValueNode';
};

export const isTypeAliasTagValueNode = (
  node: PhpDocTagValueNode,
): node is TypeAliasTagValueNode => {
  return node.getNodeType() === 'TypeAliasTagValueNode';
};

export const isAssertTagPropertyValueNode = (
  node: PhpDocTagValueNode,
): node is AssertTagPropertyValueNode => {
  return node.getNodeType() === 'AssertTagPropertyValueNode';
};

export const isTypelessParamTagValueNode = (
  node: PhpDocTagValueNode,
): node is TypelessParamTagValueNode => {
  return node.getNodeType() === 'TypelessParamTagValueNode';
};

export const isVarTagValueNode = (
  node: PhpDocTagValueNode,
): node is VarTagValueNode => {
  return node.getNodeType() === 'VarTagValueNode';
};

export const isMethodTagValueParameterNode = (
  node: PhpDocTagValueNode,
): node is MethodTagValueParameterNode => {
  return node.getNodeType() === 'MethodTagValueParameterNode';
};

export const isAssertTagMethodValueNode = (
  node: PhpDocTagValueNode,
): node is AssertTagMethodValueNode => {
  return node.getNodeType() === 'AssertagMethodValueNode';
};

export const isTemplateTagValueNode = (
  node: PhpDocTagValueNode,
): node is TemplateTagValueNode => {
  return node.getNodeType() === 'TemplateTagValueNode';
};

export const isImplementsTagValueNode = (
  node: PhpDocTagValueNode,
): node is ImplementsTagValueNode => {
  return node.getNodeType() === 'ImplementsTagValueNode';
};

export const isThrowsTagValueNode = (
  node: PhpDocTagValueNode,
): node is ThrowsTagValueNode => {
  return node.getNodeType() === 'ThrowsTagValueNode';
};

export const isSelfOutTagValueNode = (
  node: PhpDocTagValueNode,
): node is SelfOutTagValueNode => {
  return node.getNodeType() === 'SelfOutTagValueNode';
};

export const isPropertyTagValueNode = (
  node: PhpDocTagValueNode,
): node is PropertyTagValueNode => {
  return node.getNodeType() === 'PropertyTagValueNode';
};

export const isTypeAliasImportTagValueNode = (
  node: PhpDocTagValueNode,
): node is TypeAliasImportTagValueNode => {
  return node.getNodeType() === 'TypeAliasImportTagValueNode';
};

export const isMixinTagValueNode = (
  node: PhpDocTagValueNode,
): node is MixinTagValueNode => {
  return node.getNodeType() === 'MixinTagValueNode';
};

export const isPhpDocTagValueNode = (
  node: PhpDocTagValueNode,
): node is PhpDocTagValueNode => {
  return node.getNodeType() === 'PhpDocTagValueNode';
};

export const isReturnTagValueNode = (
  node: PhpDocTagValueNode,
): node is ReturnTagValueNode => {
  return node.getNodeType() === 'ReturnTagValueNode';
};
