import { isTslAssignment, isTslPlaceholder, isTslReference, TslPlaceholder, TslStatement } from '../generated/ast.js';
import { AstUtils, Stream } from 'langium';
import { getAssignees } from '../helpers/nodeProperties.js';

export class TTSLSlicer {
    /**
     * Computes the subset of the given statements that are needed to calculate the target placeholders.
     */
    computeBackwardSlice(statements: TslStatement[], targets: TslPlaceholder[]): TslStatement[] {
        const aggregator = new BackwardSliceAggregator(targets);

        for (const statement of statements.reverse()) {
            // Keep if it declares a target
            if (
                isTslAssignment(statement) &&
                getAssignees(statement).some((it) => isTslPlaceholder(it) && aggregator.targets.has(it))
            ) {
                aggregator.addStatement(statement);
            }
        }

        return aggregator.statements;
    }
}

class BackwardSliceAggregator {
    /**
     * The statements that are needed to calculate the target placeholders.
     */
    readonly statements: TslStatement[] = [];

    /**
     * The target placeholders that should be calculated.
     */
    readonly targets: Set<TslPlaceholder>;

    constructor(initialTargets: TslPlaceholder[]) {
        this.targets = new Set(initialTargets);
    }

    addStatement(statement: TslStatement): void {
        this.statements.unshift(statement);

        // Remember all referenced placeholders
        this.getReferencedPlaceholders(statement).forEach((it) => {
            this.targets.add(it);
        });
    }

    private getReferencedPlaceholders(node: TslStatement): Stream<TslPlaceholder> {
        return AstUtils.streamAllContents(node).flatMap((it) => {
            if (isTslReference(it) && isTslPlaceholder(it.target.ref)) {
                return [it.target.ref];
            } else {
                return [];
            }
        });
    }
}
