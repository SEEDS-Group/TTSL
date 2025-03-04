import { describe, expect, it } from 'vitest';
import { CallGraph } from '../../../src/language/flow/model.js';
import { getNodeOfType } from '../../helpers/nodeFinder.js';
import { createTTSLServices } from '../../../src/language/index.js';
import { EmptyFileSystem } from 'langium';
import { isTslModule, TslCallable } from '../../../src/language/generated/ast.js';

const services = (await createTTSLServices(EmptyFileSystem, { omitBuiltins: true })).TTSL;
const code = `
    fun f1()
    fun f2()
    fun f3()
`;

const module = await getNodeOfType(services, code, isTslModule);
const f1 = module.members[0] as TslCallable;
const f2 = module.members[1] as TslCallable;
const f3 = module.members[2] as TslCallable;

describe('call graph model', () => {
    describe('streamCalledCallables', () => {
        it.each([
            {
                graph: new CallGraph(undefined, []),
                expected: [undefined],
            },
            {
                graph: new CallGraph(f1, []),
                expected: [f1],
            },
            {
                graph: new CallGraph(f1, [new CallGraph(f2, [])]),
                expected: [f1, f2],
            },
            {
                graph: new CallGraph(f1, [new CallGraph(f2, [new CallGraph(f3, [])])]),
                expected: [f1, f2, f3],
            },
            {
                graph: new CallGraph(f1, [new CallGraph(f2, [new CallGraph(f3, [])]), new CallGraph(f1, [])]),
                expected: [f1, f2, f3, f1],
            },
        ])('should traverse the call graph depth-first in pre-order #%#', ({ graph, expected }) => {
            expect([...graph.streamCalledCallables()]).toStrictEqual(expected);
        });
    });
});
