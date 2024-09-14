import { describe, expect, it } from 'vitest';
import { AstUtils, isNamed } from 'langium';
import {
    isTslCall,
    isTslCallable,
    isTslModule,
    TslCall,
    TslCallable,
} from '../../../src/language/generated/ast.js';
import { createTTSLServices } from '../../../src/language/index.js';
import { createCallGraphTests } from './creator.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';
import { isRangeEqual } from 'langium/test';
import { locationToString } from '../../../src/helpers/locations.js';
import { AssertionError } from 'assert';
import { NodeFileSystem } from 'langium/node';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const callGraphComputer = services.flow.CallGraphComputer;

describe('TTSLCallGraphComputer', () => {
    describe('getCallGraph', async () => {
        it.each(await createCallGraphTests())('$testName', async (test) => {
            // Test is invalid
            if (test.error) {
                throw test.error;
            }

            const module = await getNodeOfType(services, test.code, isTslModule);

            for (const { location, expectedCallables } of test.expectedCallGraphs) {
                const node = AstUtils.streamAst(module).find((call) =>
                    isRangeEqual(call.$cstNode!.range, location.range),
                );
                if (!node || (!isTslCall(node) && !isTslCallable(node))) {
                    throw new Error(`Could not find call/callable at ${locationToString(location)}`);
                }

                const actualCallables = getActualCallables(node);
                try {
                    expect(actualCallables).toStrictEqual(expectedCallables);
                } catch (e) {
                    throw new AssertionError({
                        message: `Got wrong callables at ${locationToString(
                            location,
                        )}.\nExpected: [${expectedCallables.join(', ')}]\nActual: [${actualCallables.join(', ')}]`,
                        expected: expectedCallables,
                        actual: actualCallables,
                    });
                }
            }
        });
    });
});

const getActualCallables = (node: TslCall | TslCallable): string[] => {
    return callGraphComputer
        .getCallGraph(node)
        .streamCalledCallables()
        .map((callable) => {
            if (callable && isNamed(callable)) {
                return callable.name;
            } else {
                return 'undefined';
            }
        })
        .toArray();
};
