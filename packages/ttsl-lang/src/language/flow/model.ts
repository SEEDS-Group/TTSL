import { TslCallable, TslParameter } from '../generated/ast.js';
import { stream, Stream } from 'langium';

export class CallGraph {
    constructor(
        readonly root: TslCallable | TslParameter | undefined,
        readonly children: CallGraph[],
        readonly isRecursive: boolean = false,
    ) {}

    /**
     * Traverses the call graph depth-first in pre-order and returns a stream of all callables that are called directly
     * or indirectly.
     */
    streamCalledCallables(): Stream<TslCallable | TslParameter | undefined> {
        return stream(this.streamCalledCallablesGenerator());
    }

    private *streamCalledCallablesGenerator(): Generator<TslCallable | TslParameter | undefined, void> {
        yield this.root;

        for (const child of this.children) {
            yield* child.streamCalledCallablesGenerator();
        }
    }
}
