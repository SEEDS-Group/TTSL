import { AstNode, ValidationAcceptor } from 'langium';
import {
    isTslReference,
    TslCall,
    TslIndexedAccess,
    TslInfixOperation,
    TslList,
    TslDictionary,
    TslParameter,
    TslPrefixOperation,
    TslResult,
    TslTypeCast,
    isTslFunction,
} from '../generated/ast.js';
import { getArguments } from '../helpers/nodeProperties.js';
import { TTSLServices } from '../ttsl-module.js';
import {BooleanType, DictionaryType, FloatType, IntType, ListType, UnknownType } from '../typing/model.js';

export const CODE_TYPE_CALLABLE_RECEIVER = 'type/callable-receiver';
export const CODE_TYPE_MISMATCH = 'type/mismatch';
export const CODE_TYPE_MISSING_TYPE_HINT = 'type/missing-type-hint';

// -----------------------------------------------------------------------------
// Type checking
// -----------------------------------------------------------------------------

export const callArgumentTypesMustMatchParameterTypes = (services: TTSLServices) => {
    const nodeMapper = services.helpers.NodeMapper;
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslCall, accept: ValidationAcceptor) => {

        for (const argument of getArguments(node)) {
            const parameter = nodeMapper.argumentToParameter(argument);
            if (!parameter) {
                return;
            }

            const argumentType = typeComputer.computeType(argument);
            const parameterType = typeComputer.computeType(parameter);

            if (!typeChecker.isSubtypeOf(argumentType, parameterType)) {
                accept('error', `Expected type '${parameterType}' but got '${argumentType}'.`, {
                    node: argument,
                    property: 'value',
                    code: CODE_TYPE_MISMATCH,
                });
            }
        }
    };
};

export const callReceiverMustBeCallable = (services: TTSLServices) => {
    const nodeMapper = services.helpers.NodeMapper;

    return (node: TslCall, accept: ValidationAcceptor): void => {
        let receiver: AstNode | undefined = node.receiver;

        if (isTslReference(receiver)) {
            const target = receiver.target.ref;

            // We already report other errors at this position in those cases
            if (!target || isTslFunction(target)) {
                return;
            }
        }

        const callable = nodeMapper.callToCallable(node);
        if (node.receiver && !callable) {
            accept('error', 'This expression is not callable.', {
                node: node.receiver,
                code: CODE_TYPE_CALLABLE_RECEIVER,
            });
        }
    };
};

export const indexedAccessReceiverMustBeListOrMap = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslIndexedAccess, accept: ValidationAcceptor): void => {
        if (!node.receiver) {
            /* c8 ignore next 2 */
            return;
        }

        const receiverType = typeComputer.computeType(node.receiver);
        if (!typeChecker.canBeAccessedByIndex(receiverType)) {
            accept('error', `Expected type 'List<T>' or 'Map<K, V>' but got '${receiverType}'.`, {
                node: node.receiver,
                code: CODE_TYPE_MISMATCH,
            });
        }
    };
};

export const indexedAccessIndexMustHaveCorrectType = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslIndexedAccess, accept: ValidationAcceptor): void => {
        const receiverType = typeComputer.computeType(node.receiver);
        if (receiverType instanceof ListType) {
            const indexType = typeComputer.computeType(node.index);
            if (!typeChecker.isSubtypeOf(indexType, new IntType(false))) {
                accept('error', `Expected type 'Int' but got '${indexType}'.`, {
                    node,
                    property: 'index',
                    code: CODE_TYPE_MISMATCH,
                });
            }
        }
    };
};

export const infixOperationOperandsMustHaveCorrectType = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslInfixOperation, accept: ValidationAcceptor): void => {
        const leftType = typeComputer.computeType(node.leftOperand);
        const rightType = typeComputer.computeType(node.rightOperand);
        switch (node.operator) {
            case 'or':
            case 'and':
                if (node.leftOperand && !typeChecker.isSubtypeOf(leftType, new BooleanType(false))) {
                    accept('error', `Expected type 'Boolean' but got '${leftType}'.`, {
                        node: node.leftOperand,
                        code: CODE_TYPE_MISMATCH,
                    });
                }
                if (node.rightOperand && !typeChecker.isSubtypeOf(rightType, new BooleanType(false))) {
                    accept('error', `Expected type 'Boolean' but got '${rightType}'.`, {
                        node: node.rightOperand,
                        code: CODE_TYPE_MISMATCH,
                    });
                }
                return;
            case '<':
            case '<=':
            case '>=':
            case '>':
            case '+':
            case '-':
            case '*':
            case '/':
                if (
                    node.leftOperand &&
                    !typeChecker.isSubtypeOf(leftType, new FloatType(false)) &&
                    !typeChecker.isSubtypeOf(leftType, new IntType(false))
                ) {
                    accept('error', `Expected type 'Float' or 'Int' but got '${leftType}'.`, {
                        node: node.leftOperand,
                        code: CODE_TYPE_MISMATCH,
                    });
                }
                if (
                    node.rightOperand &&
                    !typeChecker.isSubtypeOf(rightType, new FloatType(false)) &&
                    !typeChecker.isSubtypeOf(rightType, new IntType(false))
                ) {
                    accept(
                        'error',
                        `Expected type 'Float' or 'Int' but got '${rightType}'.`,
                        {
                            node: node.rightOperand,
                            code: CODE_TYPE_MISMATCH,
                        },
                    );
                }
                return;
        }
    };
};

export const listMustNotContainNamedTuples = (services: TTSLServices) => {
    const typeComputer = services.types.TypeComputer;

    return (node: TslList, accept: ValidationAcceptor): void => {
        for (const element of node.elements) {
            const elementType = typeComputer.computeType(element);
            if (elementType instanceof ListType) {
                accept('error', `Cannot add a value of type '${elementType}' to a list.`, {
                    node: element,
                    code: CODE_TYPE_MISMATCH,
                });
            }
        }
    };
};

export const mapMustNotContainNamedTuples = (services: TTSLServices) => {
    const typeComputer = services.types.TypeComputer;

    return (node: TslDictionary, accept: ValidationAcceptor): void => {
        for (const entry of node.entries) {
            const keyType = typeComputer.computeType(entry.key);
            if (keyType instanceof DictionaryType) {
                accept('error', `Cannot use a value of type '${keyType}' as a Dictionary key.`, {
                    node: entry,
                    property: 'key',
                    code: CODE_TYPE_MISMATCH,
                });
            }

            const valueKey = typeComputer.computeType(entry.value);
            if (keyType instanceof DictionaryType) {
                accept('error', `Cannot use a value of type '${valueKey}' as a Dictionary value.`, {
                    node: entry,
                    property: 'value',
                    code: CODE_TYPE_MISMATCH,
                });
            }
        }
    };
};

export const parameterDefaultValueTypeMustMatchParameterType = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslParameter, accept: ValidationAcceptor) => {
        const defaultValue = node.defaultValue;
        if (!defaultValue) {
            return;
        }

        const defaultValueType = typeComputer.computeType(defaultValue);
        const parameterType = typeComputer.computeType(node);

        if (!typeChecker.isSubtypeOf(defaultValueType, parameterType)) {
            accept('error', `Expected type '${parameterType}' but got '${defaultValueType}'.`, {
                node,
                property: 'defaultValue',
                code: CODE_TYPE_MISMATCH,
            });
        }
    };
};

export const prefixOperationOperandMustHaveCorrectType = (services: TTSLServices) => {
    const typeChecker = services.types.TypeChecker;
    const typeComputer = services.types.TypeComputer;

    return (node: TslPrefixOperation, accept: ValidationAcceptor): void => {
        const operandType = typeComputer.computeType(node.operand);
        switch (node.operator) {
            case 'not':
                if (!typeChecker.isSubtypeOf(operandType, new BooleanType(false))) {
                    accept('error', `Expected type 'Boolean' but got '${operandType}'.`, {
                        node,
                        property: 'operand',
                        code: CODE_TYPE_MISMATCH,
                    });
                }
                return;
            case '-':
                if (
                    !typeChecker.isSubtypeOf(operandType, new FloatType(false)) &&
                    !typeChecker.isSubtypeOf(operandType, new IntType(false))
                ) {
                    accept(
                        'error',
                        `Expected type 'Float' or 'Int' but got '${operandType}'.`,
                        {
                            node,
                            property: 'operand',
                            code: CODE_TYPE_MISMATCH,
                        },
                    );
                }
                return;
        }
    };
};

export const typeCastExpressionMustHaveUnknownType = (services: TTSLServices) => {
    const typeComputer = services.types.TypeComputer;

    return (node: TslTypeCast, accept: ValidationAcceptor): void => {
        const expressionType = typeComputer.computeType(node.expression);
        if (node.expression && expressionType !== UnknownType) {
            accept('error', 'Type casts can only be applied to expressions of unknown type.', {
                // Using property: "expression" does not work here, probably due to eclipse-langium/langium#1218
                node: node.expression,
                code: CODE_TYPE_MISMATCH,
            });
        }
    };
};

// -----------------------------------------------------------------------------
// Missing type hints
// -----------------------------------------------------------------------------

export const parameterMustHaveTypeHint = (node: TslParameter, accept: ValidationAcceptor): void => {
    if (!node.type) {
        accept('error', 'A parameter must have a type hint.', {
            node,
            property: 'name',
            code: CODE_TYPE_MISSING_TYPE_HINT,
        });
        
    }
};

export const resultMustHaveTypeHint = (node: TslResult, accept: ValidationAcceptor): void => {
    if (!node.type) {
        accept('error', 'A result must have a type hint.', {
            node,
            property: 'name',
            code: CODE_TYPE_MISSING_TYPE_HINT,
        });
    }
};
