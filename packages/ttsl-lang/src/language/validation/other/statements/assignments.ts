import { isTslCall, isTslFunction, TslAssignment} from '../../../generated/ast.js';
import { ValidationAcceptor } from 'langium';
import { TTSLServices } from '../../../ttsl-module.js';
import { getResults, getAssignees } from '../../../helpers/nodeProperties.js';
import { pluralize } from '../../../../helpers/strings.js';

export const CODE_ASSIGNMENT_IMPLICITLY_IGNORED_RESULT = 'assignment/implicitly-ignored-result';
export const CODE_ASSIGMENT_NOTHING_ASSIGNED = 'assignment/nothing-assigned';

export const assignmentAssigneeMustGetValue =
    (services: TTSLServices) =>
    (node: TslAssignment, accept: ValidationAcceptor): void => {
        for (const assignee of getAssignees(node)) {
            if (!services.helpers.NodeMapper.assigneeToAssignedObject(assignee)) {
                accept('error', 'No value is assigned to this assignee.', {
                    node: assignee,
                    code: CODE_ASSIGMENT_NOTHING_ASSIGNED,
                });
            }
        }
    };

export const assignmentShouldNotImplicitlyIgnoreResult = (services: TTSLServices) => {
    const nodeMapper = services.helpers.NodeMapper;

    return (node: TslAssignment, accept: ValidationAcceptor): void => {
        const expression = node.expression;
        if (!isTslFunction(expression)) {
            return;
        }

        const assignees = getAssignees(node);
        const results = getResults(expression);

        if (results.length > assignees.length) {
            const kind = pluralize(results.length - assignees.length, 'result');
            const names = results
                .slice(assignees.length)
                .map((result) => `'${result.name}'`)
                .join(', ');

            accept('warning', `The assignment implicitly ignores the ${kind} ${names}.`, {
                node,
                code: CODE_ASSIGNMENT_IMPLICITLY_IGNORED_RESULT,
            });
        }
    };
};
