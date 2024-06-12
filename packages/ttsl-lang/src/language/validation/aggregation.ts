import {ValidationAcceptor } from 'langium';
import { 
    TslAggregation,
    TslFunction,
    TslStatement,
    isTslAggregation,
    isTslAssignment,
    isTslConditionalStatement,
    isTslData,
    isTslExpressionStatement,
    isTslFunction, 
    isTslLoop,
    isTslPlaceholder
} from '../generated/ast.js';
import { getParameters } from '../helpers/nodeProperties.js';

export const CODE_REFERENCE_NO_ID = 'aggregation/no-id';
export const CODE_NO_AGGREGATION_FOUND = 'type/no-aggregation-found';

// -----------------------------------------------------------------------------
// ID checking in aggregation
// -----------------------------------------------------------------------------

export const groupByVariableMustBeAnID = () => {
    return (node: TslAggregation, accept: ValidationAcceptor) => {
        let ref = node.groupedBy.id.target.ref
        if (isTslFunction(ref) && !ref.isID || isTslData(ref) && !ref.isID ) {
            accept('error', `In aggregation referenced Variable to be grouped by - '${ref.name}' - is not an ID.`, {
                node,
                code: CODE_REFERENCE_NO_ID,
            });
        }
    }
};

// -----------------------------------------------------------------------------
// ID checking in function
// -----------------------------------------------------------------------------


export const groupedFunctionHasValidID = () => {
    return (node: TslFunction, accept: ValidationAcceptor) => {
        let ref = node.groupedBy?.id.target.ref
        if (isTslFunction(ref) && !ref.isID || isTslData(ref) && !ref.isID ) {
            accept('error', `The reference the function states to be grouped by - '${ref.name}' - is not an ID.`, {
                node,
                code: CODE_REFERENCE_NO_ID,
            });
        }
        
    }
};

// -----------------------------------------------------------------------------
// grouped function must has an aggregation or a grouped local variable
// -----------------------------------------------------------------------------

export const groupedFunctionHasAggregation = () => {
    return (node: TslFunction, accept: ValidationAcceptor) => {
        let id = node.groupedBy?.id.target.ref?.name
        if (id != undefined){
            let parameters = getParameters(node)
            let isGrouped = false
            parameters.forEach(elm => {
                if (elm.groupedBy?.id.target.ref?.name == id){
                    isGrouped = true
                }
            });
            if (hasAggregation(node.body.statements, id)){
                isGrouped = true
            }
            if (!isGrouped) {
                accept('error', `The Function '${node.name}' needs a grouped Parameter or an aggregation in the function body to aggregate over '${node.groupedBy?.id.target.ref?.name}'.`, {
                    node,
                    code: CODE_NO_AGGREGATION_FOUND,
                });
            }
        }
        
    }
};

function hasAggregation(statements: TslStatement[]| undefined, id: string): boolean{
    let result =  false
    if(statements == undefined){
        return result
    }
    statements.forEach(elm => {
        if(isTslExpressionStatement(elm) && isTslAggregation(elm.expression) && elm.expression.groupedBy.id.target.ref?.name == id){
            result = true
        } else if(isTslConditionalStatement(elm)){
            result = (hasAggregation(elm.ifBlock.statements, id) && hasAggregation(elm.elseBlock?.statements, id))
        } else if(isTslLoop(elm)){
            result = hasAggregation(elm.block.statements, id)
        } else if(isTslAssignment(elm)){
            if(isTslAggregation(elm.expression)){
                result = true
            }else if(elm.assigneeList?.assignees.filter(isTslPlaceholder)){
                elm.assigneeList.assignees.filter(isTslPlaceholder).forEach(elm => {
                    if(elm.groupedBy?.id.target.ref?.name == id){
                        result = true
                    }
                })
            }
        }  
    });
    return result
}

