import { SafeDsServices } from '../safe-ds-module.js';
import {
    CallableType,
    ClassType,
    EnumType,
    EnumVariantType,
    LiteralType,
    NamedTupleEntry,
    NamedTupleType,
    NamedType,
    StaticType,
    Type,
    TypeParameterSubstitutions,
    TypeParameterType,
    UnionType,
} from './model.js';
import { Constant } from '../partialEvaluation/model.js';
import {
    TslAbstractResult,
    TslCallable,
    TslClass,
    TslDeclaration,
    TslEnum,
    TslEnumVariant,
    TslParameter,
    TslTypeParameter,
} from '../generated/ast.js';

export class SafeDsTypeFactory {
    constructor(private readonly services: SafeDsServices) {}

    createCallableType(
        callable: TslCallable,
        parameter: TslParameter | undefined,
        inputType: NamedTupleType<TslParameter>,
        outputType: NamedTupleType<TslAbstractResult>,
    ): CallableType {
        return new CallableType(this.services, callable, parameter, inputType, outputType);
    }

    createClassType(
        declaration: TslClass,
        substitutions: TypeParameterSubstitutions,
        isExplicitlyNullable: boolean,
    ): ClassType {
        return new ClassType(declaration, substitutions, isExplicitlyNullable);
    }

    createEnumType(declaration: TslEnum, isExplicitlyNullable: boolean): EnumType {
        return new EnumType(declaration, isExplicitlyNullable);
    }

    createEnumVariantType(declaration: TslEnumVariant, isExplicitlyNullable: boolean): EnumVariantType {
        return new EnumVariantType(declaration, isExplicitlyNullable);
    }

    createLiteralType(...constants: Constant[]): LiteralType {
        return new LiteralType(this.services, constants);
    }

    createNamedTupleType<T extends TslDeclaration>(...entries: NamedTupleEntry<T>[]): NamedTupleType<T> {
        return new NamedTupleType(this.services, entries);
    }

    createStaticType(instanceType: NamedType<TslDeclaration>): StaticType {
        return new StaticType(this.services, instanceType);
    }

    createTypeParameterType(declaration: TslTypeParameter, isExplicitlyNullable: boolean): TypeParameterType {
        return new TypeParameterType(declaration, isExplicitlyNullable);
    }

    createUnionType(...types: Type[]): UnionType {
        return new UnionType(this.services, types);
    }
}
