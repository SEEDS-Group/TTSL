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
    isTslTimespanStatement
} from '../generated/ast.js';
import { getParameters } from '../helpers/nodeProperties.js';

export const CODE_REFERENCE_TOO_MANY_IDS = "aggregation/too-many-ids"
export const CODE_REFERENCE_NO_ID = 'aggregation/no-id';
export const CODE_NO_AGGREGATION_FOUND = 'type/no-aggregation-found';

// -----------------------------------------------------------------------------
// ID checking in aggregation
// -----------------------------------------------------------------------------

export const groupByVariableMustBeASingleID = () => {
    return (node: TslAggregation, accept: ValidationAcceptor) => {
        let ids = node.groupedBy.id.map(id => id.target.ref)
        if (!(ids.length === 1)){
            accept('error', `An aggregation can only aggregate over exactly one ID`, {
                node,
                code: CODE_REFERENCE_TOO_MANY_IDS,
            });
        } else {
            let id = ids.at(0)
            if (isTslFunction(id) && !id.isID || isTslData(id) && !id.isID ) {
                accept('error', `In aggregation referenced Variable to be grouped by - '${id.name}' - is not an ID.`, {
                    node,
                    code: CODE_REFERENCE_NO_ID,
                });
            }
        }
        
    }
};

// -----------------------------------------------------------------------------
// ID checking in function
// -----------------------------------------------------------------------------


export const groupedFunctionHasValidID = () => {
    return (node: TslFunction, accept: ValidationAcceptor) => {
        let ids = node.groupedBy?.id.map(id => id.target.ref)
        ids?.forEach(id => {
                if (isTslFunction(id) && !id.isID || isTslData(id) && !id.isID ) {
                    accept('error', `The reference the function states to be grouped by - '${id.name}' - is not an ID.`, {
                        node,
                        code: CODE_REFERENCE_NO_ID,
                    });
                }
            }  
        )
    }
};

// -----------------------------------------------------------------------------
// grouped function must has an aggregation or a grouped local variable
// -----------------------------------------------------------------------------

export const groupedFunctionHasAggregation = () => {
    return (node: TslFunction, accept: ValidationAcceptor) => {
        let ids = node.groupedBy?.id.map(id => id.target.ref?.name)
        ids?.forEach(id => {
            if (id !== undefined){
                let parameters = getParameters(node)
                let isGrouped = false
                parameters.forEach(elm => {
                    if (elm.groupedBy?.id.map(elmId => elmId.target.ref?.name).includes(id)){
                        isGrouped = true
                    }
                });
                if (hasAggregation(node.body.statements, id)){
                    isGrouped = true
                }
                if (!isGrouped) {
                    accept('error', `The Function '${node.name}' needs a grouped Parameter or an aggregation in the function body to aggregate over '${id}'.`, {
                        node,
                        code: CODE_NO_AGGREGATION_FOUND,
                    });
                }
            }
        })
    }
};

const hasAggregation = (statements: TslStatement[]| undefined, id: string, prev: boolean = false) => {
    if(statements === undefined){
        return false || prev
    }
    statements.forEach(stmt => {
        if(isTslExpressionStatement(stmt) && isTslAggregation(stmt.expression) && stmt.expression.groupedBy.id.map(elmId => elmId.target.ref?.name).includes(id)){
            prev =  true;
        } else if (isTslAssignment(stmt) && isTslAggregation(stmt.expression) && stmt.expression.groupedBy.id.map(elmId => elmId.target.ref?.name).includes(id)){
            prev = true;
        }
    })

    statements.forEach(elm => {
        if(isTslConditionalStatement(elm)){
            prev = hasAggregation(elm.ifBlock.statements, id, prev) && hasAggregation(elm.elseBlock?.statements, id, prev)
        } else if(isTslLoop(elm) || isTslTimespanStatement(elm)){
            prev = hasAggregation(elm.block.statements, id, prev)
        }
    });
    return prev
}

