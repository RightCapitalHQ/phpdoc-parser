import { BaseNode } from '../base-node';
import type { ArrayShapeItemNode } from './array-shape-item-node';
import type { ArrayShapeNode } from './array-shape-node';
import type { ArrayTypeNode } from './array-type-node';
import type { CallableTypeNode } from './callable-type-node';
import type { CallableTypeParameterNode } from './callable-type-parameter-node';
import type { ConditionalTypeForParameterNode } from './conditional-type-for-parameter-node';
import type { ConditionalTypeNode } from './conditional-type-node';
import type { ConstTypeNode } from './const-type-node';
import type { GenericTypeNode } from './generic-type-node';
import type { IdentifierTypeNode } from './identifier-type-node';
import type { IntersectionTypeNode } from './intersection-type-node';
import type { InvalidTypeNode } from './invalid-type-node';
import type { NullableTypeNode } from './nullable-type-node';
import type { ObjectShapeItemNode } from './object-shape-item-node';
import type { ObjectShapeNode } from './object-shape-node';
import type { OffsetAccessTypeNode } from './offset-access-type-node';
import type { ThisTypeNode } from './this-type-node';
import type { UnionTypeNode } from './union-type-node';

/**
 * TypeNode is a abstract Node for containing other nodes
 * We could get an specific Node via TypeGuard like
 * isXxxNode function
 *
 * https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates
 */
export class TypeNode extends BaseNode {
  public getNodeType(): string {
    return 'TypeNode';
  }

  public isArrayShapeItemNode(): this is ArrayShapeItemNode {
    return this.getNodeType() === 'ArrayShapeItemNode';
  }

  public isArrayShapeNode(): this is ArrayShapeNode {
    return this.getNodeType() === 'ArrayShapeNode';
  }

  public isArrayTypeNode(): this is ArrayTypeNode {
    return this.getNodeType() === 'ArrayTypeNode';
  }

  public isCallableTypeNode(): this is CallableTypeNode {
    return this.getNodeType() === 'CallableTypeNode';
  }

  public isCallableTypeParameterNode(): this is CallableTypeParameterNode {
    return this.getNodeType() === 'CallableTypeParameterNode';
  }

  public isConditionalTypeForParameterNode(): this is ConditionalTypeForParameterNode {
    return this.getNodeType() === 'ConditionalTypeForParameterNode';
  }

  public isConditionalTypeNode(): this is ConditionalTypeNode {
    return this.getNodeType() === 'ConditionalTypeNode';
  }

  public isConstTypeNode(): this is ConstTypeNode {
    return this.getNodeType() === 'ConstTypeNode';
  }

  public isGenericTypeNode(): this is GenericTypeNode {
    return this.getNodeType() === 'GenericTypeNode';
  }

  public isIdentifierTypeNode(): this is IdentifierTypeNode {
    return this.getNodeType() === 'IdentifierTypeNode';
  }

  public isIntersectionTypeNode(): this is IntersectionTypeNode {
    return this.getNodeType() === 'IntersectionTypeNode';
  }

  public isInvalidTypeNode(): this is InvalidTypeNode {
    return this.getNodeType() === 'InvalidTypeNode';
  }

  public isNullableTypeNode(): this is NullableTypeNode {
    return this.getNodeType() === 'NullableTypeNode';
  }

  public isObjectShapeItemNode(): this is ObjectShapeItemNode {
    return this.getNodeType() === 'ObjectShapeItemNode';
  }

  public isObjectShapeNode(): this is ObjectShapeNode {
    return this.getNodeType() === 'ObjectShapeNode';
  }

  public isOffsetAccessTypeNode(): this is OffsetAccessTypeNode {
    return this.getNodeType() === 'OffsetAccessTypeNode';
  }

  public isThisTypeNode(): this is ThisTypeNode {
    return this.getNodeType() === 'ThisTypeNode';
  }

  public isUnionTypeNode(): this is UnionTypeNode {
    return this.getNodeType() === 'UnionTypeNode';
  }
}
