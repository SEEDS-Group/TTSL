import { AstUtils } from 'langium';
import { isTslFunction, isTslTimespan, isTslTimespanStatement, TslReference, TslTimespan } from '../generated/ast.js';

export class TTSLTimespanComputer {
    // -----------------------------------------------------------------------------------------------------------------
    // Compute Timespan
    // -----------------------------------------------------------------------------------------------------------------

    computeContainingTimespan(node: TslReference | TslTimespan): string[] {
        const containingFunction = AstUtils.getContainerOfType(node, isTslFunction);
        const containingTimespan = AstUtils.getContainerOfType(node, isTslTimespanStatement);

        let result = this.computeTimespan(
            containingTimespan!.timespan,
            containingFunction?.body.statements.filter(isTslTimespanStatement).map((stmt) => stmt.timespan)!,
        );

        return result;
    }

    private computeTimespan(node: TslTimespan, allTimespans: TslTimespan[]): string[] {
        const indexOfTimespan = allTimespans.findIndex((timespan) => timespan === node)!;

        let start = '';
        let end = '';
        // compute missing Timespan date if needed
        if (!node.end && node.start) {
            start = node.start.date;

            const followingTimespan = allTimespans.at(indexOfTimespan + 1);
            if (!followingTimespan?.start) {
                end = new Date().toLocaleString('fr-CA').split(' ')[0]!;
            } else {
                end = followingTimespan.start!.date!;
            }
        } else if (!node.start && node.end) {
            end = node.end.date;

            const beforeTimespan = allTimespans.at(indexOfTimespan - 1);

            if (!beforeTimespan?.end) {
                start = '1900-01-01';
            } else {
                start = beforeTimespan.end!.date!;
            }
        } else {
            start = node.start!.date!;
            end = node.end!.date!;
        }
        return [start, end];
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Get Timespans
    // -----------------------------------------------------------------------------------------------------------------

    getPreviousTimespan(node: TslTimespan): TslTimespan | undefined {
        const containingFunction = AstUtils.getContainerOfType(node, isTslFunction);
        const allTimespans = containingFunction?.body.statements
            .filter(isTslTimespanStatement)
            .map((stmt) => stmt.timespan)!;
        const indexOfTimespan = allTimespans.findIndex((timespan) => timespan === node)!;

        const previousTimespan = allTimespans.at(indexOfTimespan - 1);

        return previousTimespan;
    }

    hasPreviousTimespan(): boolean {
        return isTslTimespan(this.getPreviousTimespan);
    }

    getFollowingTimespan(node: TslTimespan): TslTimespan | undefined {
        const containingFunction = AstUtils.getContainerOfType(node, isTslFunction);
        const allTimespans = containingFunction?.body.statements
            .filter(isTslTimespanStatement)
            .map((stmt) => stmt.timespan)!;
        const indexOfTimespan = allTimespans.findIndex((timespan) => timespan === node)!;

        const followingTimespan = allTimespans.at(indexOfTimespan + 1);

        return followingTimespan;
    }

    hasFollowingTimespan(): boolean {
        return isTslTimespan(this.getFollowingTimespan);
    }
}
