import { TTSLServices } from '../ttsl-module.js';
import {
    CallableType,
    DictionaryType,
    ListType,
    NamedTupleEntry,
    NamedTupleType,
    Type,
    UnionType,
} from './model.js';
import {
    TslCallable,
    TslDeclaration,
    TslDictionary,
    TslList,
    TslParameter,
    TslResult,
} from '../generated/ast.js';

export class TTSLTypeFactory {
    constructor(private readonly services: TTSLServices) {}

    createCallableType(
        callable: TslCallable,
        parameter: TslParameter | undefined,
        inputType: NamedTupleType<TslParameter>,
        outputType: NamedTupleType<TslResult>,
    ): CallableType {
        return new CallableType(this.services, callable, parameter, inputType, outputType);
    }

    createNamedTupleType<T extends TslDeclaration>(...entries: NamedTupleEntry<T>[]): NamedTupleType<T> {
        return new NamedTupleType(this.services, entries);
    }

    createUnionType(
        types: Type[]
    ): UnionType {
        return new UnionType(this.services, types)
    }

    createDictionaryType(
        dictionary: TslDictionary,
    ): DictionaryType {
        return new DictionaryType(this.services, dictionary);
    }

    createListType(
        list: TslList,
    ): ListType {
        return new ListType(this.services, list);
    }
}
