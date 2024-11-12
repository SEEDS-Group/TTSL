import { AstNode, AstNodeLocator, AstUtils, WorkspaceCache } from 'langium';
import {
    isTslArgument,
    isTslAssignee,
    isTslAssignment,
    isTslCall,
    isTslDeclaration,
    isTslExpression,
    isTslFunction,
    isTslIndexedAccess,
    isTslInfixOperation,
    isTslList,
    isTslDictionary,
    isTslParameter,
    isTslPrefixOperation,
    isTslReference,
    isTslResult,
    isTslTemplateString,
    isTslType,
    isTslTypeCast,
    TslAssignee,
    TslCall,
    TslDeclaration,
    TslExpression,
    TslFunction,
    TslIndexedAccess,
    TslInfixOperation,
    TslParameter,
    TslPrefixOperation,
    TslReference,
    TslType,
    isTslIntType,
    isTslFloatType,
    isTslStringType,
    isTslBooleanType,
    isTslInt,
    isTslFloat,
    isTslBoolean,
    isTslString,
    isTslAnyType,
    isTslLocalVariable,
    TslLocalVariable,
    isTslForeachLoop,
    isTslDictionaryType,
    isTslListType,
    isTslConstant,
    isTslNothingType,
    isTslNull,
    isTslData,
    TslTimespan,
    isTslTimespanStatement,
    TslTimespanValueEntry,
    isTslAggregation,
    isTslTypeAlias,
    isTslCallable,
    isTslPredefinedFunction,
    TslPredefinedFunction,
} from '../generated/ast.js';
import { TTSLServices } from '../ttsl-module.js';
import {
    Type,
    DictionaryType,
    ListType,
    UnknownType,
    BooleanType,
    IntType,
    FloatType,
    StringType,
    NothingType,
    AnyType,
} from './model.js';
import type { TTSLTypeChecker } from './ttsl-type-checker.js';

export class TTSLTypeComputer {
    private readonly astNodeLocator: AstNodeLocator;
    private readonly typeChecker: TTSLTypeChecker;

    private readonly nodeTypeCache: WorkspaceCache<string, Type>;

    constructor(services: TTSLServices) {
        this.astNodeLocator = services.workspace.AstNodeLocator;
        this.typeChecker = services.types.TypeChecker;

        this.nodeTypeCache = new WorkspaceCache(services.shared);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Compute type
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Computes the type of the given node and applies the given substitutions for type parameters. The result gets
     * simplified as much as possible.
     */
    computeType(node: AstNode | undefined): Type {
        if (!node) {
            return UnknownType;
        }

        // Ignore type parameter substitutions for caching
        const unsubstitutedType = this.nodeTypeCache.get(this.getNodeId(node), () =>
            this.doComputeType(node),
        );
        return unsubstitutedType;
    }

    private getNodeId(node: AstNode) {
        const documentUri = AstUtils.getDocument(node).uri.toString();
        const nodePath = this.astNodeLocator.getAstNodePath(node);
        return `${documentUri}~${nodePath}`;
    }

    private doComputeType(node: AstNode): Type {
        if (isTslAssignee(node)) {
            return this.computeTypeOfAssignee(node);
        } else if (isTslDeclaration(node)) {
            return this.computeTypeOfDeclaration(node);
        } else if (isTslExpression(node)) {
            return this.computeTypeOfExpression(node);
        } else if (isTslType(node)) {
            return this.computeTypeOfType(node);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfAssignee(node: TslAssignee): Type {
        const containingAssignment = AstUtils.getContainerOfType(node, isTslAssignment);
        if (!containingAssignment) {
            /* c8 ignore next 2 */
            return UnknownType;
        }

        const expressionType = this.computeType(containingAssignment?.expression);
        return expressionType;
    }

    private computeTypeOfDeclaration(node: TslDeclaration): Type {
        if (isTslFunction(node)) {
            return this.computeTypeOfCallableWithManifestTypes(node);
        } else if (isTslParameter(node)) {
            return this.computeTypeOfParameter(node);
        } else if (isTslResult(node) || isTslData(node) || isTslTypeAlias(node)) {
            return this.computeType(node.type);
        } else if (isTslConstant(node)){
            if(node.type.length === 1){
                return this.computeType(node.type.at(0));
            }else{
                return UnknownType;
            }
        } else if (isTslLocalVariable(node) && isTslForeachLoop(node.$container)){
            return this.computeTypeOfElm(node);
        }/* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfCallableWithManifestTypes(node: TslFunction ): Type {
        if(isTslFunction(node)){
            return this.computeType(node.result);
        }else{
            return UnknownType;
        }
    }

    private computeTypeOfParameter(node: TslParameter): Type {
        // Manifest type
        const type = this.computeType(node.type);
        return type;
    }

    private computeTypeOfExpression(node: TslExpression): Type {
        // Type cast
        if (isTslTypeCast(node)) {
            return this.computeType(node.type);
        }

        // Terminal cases
        if (isTslList(node)) {
            const elementType = this.lowestCommonSupertype(node.elements.map((it) => this.computeType(it)));
            return new ListType([elementType], false);
        } else if (isTslDictionary(node)) {
            let keyType = this.lowestCommonSupertype(node.entries.map((it) => this.computeType(it.key)));

            const valueType = this.lowestCommonSupertype(node.entries.map((it) => this.computeType(it.value)));
            return new DictionaryType([keyType, valueType], false);
        } else if (isTslTemplateString(node)) {
            return new StringType(false);
        } else if(isTslInt(node)){
            return new IntType(false);
        } else if(isTslFloat(node)){
            return new FloatType(false);
        } else if(isTslBoolean(node)){
            return new BooleanType(false);
        } else if(isTslString(node) || isTslTemplateString(node)){
            return new StringType(false);
        } else if(isTslNull(node)){
            return new NothingType(true);
        }

        // Recursive cases
        else if (isTslArgument(node)) {
            return this.computeType(node.value);
        } else if (isTslCall(node)) {
            return this.computeTypeOfCall(node);
        } else if (isTslIndexedAccess(node)) {
            return this.computeTypeOfIndexedAccess(node);
        } else if (isTslInfixOperation(node)) {
            switch (node.operator) {
                // Boolean operators
                case 'or':
                case 'and':
                    return new BooleanType(false);

                // Equality operators
                case '==':
                case '!=':
                case '===':
                case '!==':
                    return new BooleanType(false);

                // Comparison operators
                case '<':
                case '<=':
                case '>=':
                case '>':
                    return new BooleanType(false);

                // Arithmetic operators
                case '+':
                case '-':
                case '*':
                case '/':
                    return this.computeTypeOfArithmeticInfixOperation(node);

                // Elvis operator
                case '?:':
                    return this.computeTypeOfElvisOperation(node);

                // Unknown operator
                /* c8 ignore next 2 */
                default:
                    return UnknownType;
            }
        } else if (isTslPrefixOperation(node)) {
            switch (node.operator) {
                case 'not':
                    return new BooleanType(false);
                case '-':
                    return this.computeTypeOfArithmeticPrefixOperation(node);

                // Unknown operator
                /* c8 ignore next 2 */
                default:
                    return UnknownType; 
            }
        } else if (isTslReference(node)) {
            return this.computeTypeOfReference(node);
        } else if (isTslAggregation(node)) {
            return this.computeType(node.data);
        } else if (isTslPredefinedFunction(node)) {
            return this.computeTypeOfPredefinedFunction(node);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfCall(node: TslCall): Type {
        if(isTslReference(node.receiver) && !isTslCallable(node.receiver.target.ref)){
            return UnknownType
        }
        const receiverType = this.computeType(node.receiver);
        let result = receiverType
        
        // Update nullability
        return result.withExplicitNullability(receiverType.isExplicitlyNullable && node.isNullSafe);
    }

    private computeTypeOfIndexedAccess(node: TslIndexedAccess): Type {
        const receiverType = this.computeType(node.receiver);
        if (!(receiverType instanceof ListType) && !(receiverType instanceof DictionaryType)) {
            return UnknownType;
        }

        // Receiver is a list
        if (receiverType instanceof ListType) {
            return receiverType
                .getTypeParameterTypeByIndex(0)
                .withExplicitNullability(receiverType.isExplicitlyNullable && node.isNullSafe);
        }

        // Receiver is a Dictionary
        if (receiverType instanceof DictionaryType) {
            return receiverType
                .getTypeParameterTypeByIndex(1)
                .withExplicitNullability(receiverType.isExplicitlyNullable && node.isNullSafe);
        }

        return UnknownType;
    }

    private computeTypeOfArithmeticInfixOperation(node: TslInfixOperation): Type {
        const leftOperandType = this.computeType(node.leftOperand);
        const rightOperandType = this.computeType(node.rightOperand);

        if (
            leftOperandType instanceof IntType &&
            rightOperandType instanceof IntType
        ) {
            return new IntType(false);
        } else {
            return new FloatType(false);
        }
    }

    private computeTypeOfElvisOperation(node: TslInfixOperation): Type {
        const leftOperandType = this.computeType(node.leftOperand);
        if (leftOperandType.isExplicitlyNullable) {
            const rightOperandType = this.computeType(node.rightOperand);
            if (rightOperandType.toString().includes(leftOperandType.toString().replace('?',''))){
                return rightOperandType;
            } else if(rightOperandType instanceof NothingType){
                return leftOperandType;
            }
            return new AnyType(rightOperandType.isExplicitlyNullable);
        } else {
            return leftOperandType;
        }
    }

    private computeTypeOfArithmeticPrefixOperation(node: TslPrefixOperation): Type {
        const operandType = this.computeType(node.operand);

        if (operandType instanceof IntType) {
            return new IntType(false);
        } else {
            return new FloatType(false);
        }
    }

    private computeTypeOfReference(node: TslReference): Type {
        const target = node.target.ref;
        
        // Compute Type of Constant with different Types for different Timespans
        if(isTslConstant(target) && (!target.type.at(0) || target.type.length >= 2)){

            const containingTimespan = this.computeContainingTimespan(node);
            const constantTimespans = this.fillinTimespans(target.timespanValueEntries)

            if(containingTimespan && constantTimespans){
                let indexOfCorrectConstant = constantTimespans.indexOf(constantTimespans.filter(timespan => 
                    timespan.at(0)! >= containingTimespan.at(0)! && timespan.at(0)! < containingTimespan.at(1)! ||
                    timespan.at(1)! > containingTimespan.at(0)! && timespan.at(1)! < containingTimespan.at(1)! ||
                    timespan.at(0)! <= containingTimespan.at(0)! && timespan.at(1)! >= containingTimespan.at(1)!
                ).at(0)!)
                return this.doComputeType(target.timespanValueEntries.at(indexOfCorrectConstant)!.value)
            }
        }
        const instanceType = this.computeType(target);

        return instanceType;
    }

    private computeTypeOfPredefinedFunction(node: TslPredefinedFunction): Type {
        const obj = node.object.target.ref
        const typeOfObj = this.computeType(obj)

        if(!(typeOfObj instanceof ListType || typeOfObj instanceof DictionaryType)){
            return UnknownType;
        }

        if(node.name === "len"){
            return new IntType(false);
        } else if (typeOfObj instanceof DictionaryType){
            if(node.name === "keys"){
                return new ListType([typeOfObj.getTypeParameterTypeByIndex(0)], false)
            } else {
                return new ListType([typeOfObj.getTypeParameterTypeByIndex(1)], false)
            }
        }
        return UnknownType
    }

    private computeContainingTimespan(node: TslReference): string[] {
        const containingFunction = AstUtils.getContainerOfType(node, isTslFunction)
        const containingTimespan = AstUtils.getContainerOfType(node, isTslTimespanStatement)

        let result = this.computeTimespan(containingTimespan!.timespan, containingFunction?.body.timespanStatement.map(stmt => stmt.timespan)!)

        return result
    }

    private computeTimespan(node: TslTimespan, allTimespans: TslTimespan[]): string[]{
        const indexOfTimespan = allTimespans.findIndex(timespan => timespan === node)!

        let start = ""
        let end = ""
        // compute missing Timespan date if needed
        if(!node.end && node.start){
            start = node.start.date
            
            const followingTimespan = allTimespans.at(indexOfTimespan + 1)
            if(!followingTimespan){
                end = new Date().toLocaleString("fr-CA").split(' ')[0]!
            } else {
                end = followingTimespan?.start!.date!
            }
        } else if(!node.start && node.end){
            end = node.end.date

            const beforeTimespan = allTimespans.at(indexOfTimespan - 1)

            if(!beforeTimespan){
                start = "1900-01-01"
            } else {
                start = beforeTimespan?.end!.date!
            }
        } else {
            start = node.start!.date!
            end = node.end!.date!
        }
        return [start, end]
    }

    private fillinTimespans(node: TslTimespanValueEntry[]): String[][]{
        let result = [["start", "end"]]
        let now = new Date().toLocaleString("fr-CA").split(' ')[0]!
        node.forEach(timespan => {
                let index = node.indexOf(timespan)
                if(!timespan.timespan.end && timespan.timespan.start){
                    if(!node.at(index+1)){
                        result.push([timespan.timespan.start?.date, now])
                    }else{
                        result.push([timespan.timespan.start?.date, node.at(index+1)?.timespan.start?.date!])
                    }
                } else if(!timespan.timespan.start && timespan.timespan.end){
                    if(!node.at(index-1)){
                        result.push(["1900-01-01", timespan.timespan.end?.date])
                    }else{
                        result.push([node.at(index-1)?.timespan.end?.date!, timespan.timespan.end?.date])
                    }
                } else {
                    result.push([timespan.timespan.start?.date!, timespan.timespan.end?.date!])
                }
            }
        )
        return result.slice(1)
    }

    private computeTypeOfType(node: TslType): Type {
        if (isTslIntType(node)) {
            if (node.isNullable){
                return new IntType(true);
            }
            return new IntType(false);
        } else if (isTslFloatType(node)) {
            if (node.isNullable){
                return new FloatType(true);
            }
            return new FloatType(false);
        } else if (isTslStringType(node)) {
            if (node.isNullable){
                return new StringType(true);
            }
            return new StringType(false);
        } else if (isTslBooleanType(node)) {
            if (node.isNullable){
                return new BooleanType(true);
            }
            return new BooleanType(false);
        } else if (isTslAnyType(node)) {
            if (node.isNullable){
                return new AnyType(true);
            }
            return new AnyType(false);
        } else if (isTslListType(node)) {
            const elementType = node.typeParameterList.typeParameters.map((it) => this.computeTypeOfType(it.type));
            if (node.isNullable){
                return new ListType(elementType, true);
            }
            return new ListType(elementType, false);
        } else if (isTslDictionaryType(node)) {
            const types = node.typeParameterList.typeParameters.map((it) => this.computeTypeOfType(it.type));
            if (node.isNullable){
                return new DictionaryType(types, true);
            }
            return new DictionaryType(types, false);
        } else if (isTslNothingType(node)) {
            if (node.isNullable){
                return new NothingType(true);
            }
            return new NothingType(false);
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    private computeTypeOfElm(node: TslLocalVariable): Type{
        if(isTslForeachLoop(node.$container)){
            let listType = this.computeType(node.$container.list)
            if(listType instanceof ListType){
                return listType.getTypeParameterTypeByIndex(0)
            } else{
                return UnknownType;
            }
        } /* c8 ignore start */ else {
            return UnknownType;
        } /* c8 ignore stop */
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Various type conversions
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Returns the non-nullable type for the given type. The result is simplified as much as possible.
     */
    computeNonNullableType(type: Type): Type {
        return type.withExplicitNullability(false);
    }


// -----------------------------------------------------------------------------------------------------------------
    // Lowest common supertype
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Computes the lowest common supertype for the given types. The result is simplified as much as possible.
     */
    private lowestCommonSupertype(types: Type[]): Type {
        // A single type is its own lowest common supertype
        if (types.length === 1) {
            return types[0]!;
        } else if(types.length === 0){
            return new NothingType(false)
        }

        // Partition types by their kind
        const partitionedTypes = this.partitionTypesLCS(types);

        // Includes unknown type
        if (partitionedTypes.containsUnknownType) {
            return new AnyType(true);
        }

        // The result must be nullable if any of the types is nullable
        const isNullable = types.some((it) => it.isExplicitlyNullable || it instanceof NothingType);

        // Includes unhandled type
        if (partitionedTypes.containsOtherType) {
            return new AnyType(isNullable);
        }

        let firstType = types.at(0)
        if (firstType && types.every(type => type.toString() === firstType.toString())){
            return types[0]!
        } else if (firstType && types.every(type => type.toString() === firstType.toString() || type instanceof NothingType)){
            return types[0]?.withExplicitNullability(true)!
        } else if( firstType && !(types.every(type => type.toString() === firstType.toString()))){
            return new AnyType(isNullable)
        }

        return UnknownType
    }


    /**
     * Partitions the given types by their kind. This function assumes that union types have been removed. It is only
     * meant to be used when computing the lowest common supertype (LCS).
     */
    private partitionTypesLCS(types: Type[]): PartitionTypesLCSResult {
        const result: PartitionTypesLCSResult = {
            containsUnknownType: false,
            containsOtherType: false,
        };
        
        for (const type of types) {
            if (type.equals(new NothingType(false)) || type.equals(new NothingType(true))) {
                // Drop Nothing/Nothing? types. They are compatible to everything with appropriate nullability.
            } else if (type === UnknownType) {
                result.containsUnknownType = true;
            } else if(!(type instanceof AnyType)) {
                // Since these types don't occur in legal programs, we don't need to handle them better
                result.containsOtherType = true;
                return result;
            }
        }

        return result;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------------------------------------------------

    private Any(isNullable: boolean): Type {
        return isNullable ? new AnyType(true) : new AnyType(false);
    }

}

interface PartitionTypesLCSResult {
    containsUnknownType: boolean;
    containsOtherType: boolean;
}
