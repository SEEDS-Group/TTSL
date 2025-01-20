import { ValidationAcceptor } from "langium";
import { TslTimespan } from "../../../generated/ast.js";
import { TTSLServices } from "../../../ttsl-module.js";


export const CODE_MISSMATCHING_TIMESPAN = 'import/missmatching-timespan';

export const followingOrPreviousMustFillInMissingTimespanInformation = (services: TTSLServices) => {
    const timespanComputer = services.helpers.TimespanComputer;

    return (node: TslTimespan, accept: ValidationAcceptor): void => {
        if (!node.start && timespanComputer.hasPreviousTimespan(node) && !timespanComputer.getPreviousTimespan(node)?.end) {
            accept('error', `Timespan is missing a starting date.`, {
                node: node,
                code: CODE_MISSMATCHING_TIMESPAN,
            });
        }
        else if (!node.end && timespanComputer.hasFollowingTimespan(node) && !timespanComputer.getFollowingTimespan(node)?.start){
            accept('error', `Timespan is missing an ending date.`, {
                node: node,
                code: CODE_MISSMATCHING_TIMESPAN,
            });
        }
    };
};