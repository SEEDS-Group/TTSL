import { EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import {
    isTslModule,
    TslArgument,
    TslFunction,
    TslParameter,
    TslPipeline,
} from '../../../../src/language/generated/ast.js';
import { createSafeDsServices, getArguments, getModuleMembers, getParameters } from '../../../../src/language/index.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';

const services = (await createSafeDsServices(EmptyFileSystem, { omitBuiltins: true })).SafeDs;
const callGraphComputer = services.flow.CallGraphComputer;
const nodeMapper = services.helpers.NodeMapper;

const code = `
    fun myFunction(p1: String, p2: String)

    pipeline myPipeline {
        myFunction(1, 2, p1 = 3, p3 = 4);
    }
`;
const module = await getNodeOfType(services, code, isTslModule);
const myFunction = getModuleMembers(module)[0] as TslFunction;
const p1 = getParameters(myFunction)[0]!;
const myPipeline = module?.members[1] as TslPipeline;
const call1 = callGraphComputer.getAllContainedCalls(myPipeline)[0]!;
const arg1 = getArguments(call1)[0]!;
const arg2 = getArguments(call1)[1]!;
const arg3 = getArguments(call1)[2]!;
const arg4 = getArguments(call1)[3]!;

describe('SafeDsNodeMapper', () => {
    const testCases: ParametersToArgumentsTest[] = [
        {
            testName: 'both lists empty',
            parameters: [],
            args: [],
            expectedResult: [],
        },
        {
            testName: 'parameters empty',
            parameters: [],
            args: [arg1],
            expectedResult: [],
        },
        {
            testName: 'arguments empty',
            parameters: [p1],
            args: [],
            expectedResult: [],
        },
        {
            testName: 'one parameter, one argument',
            parameters: [p1],
            args: [arg1],
            expectedResult: [[p1, arg1]],
        },
        {
            testName: 'unresolved argument',
            parameters: [p1],
            args: [arg4],
            expectedResult: [],
        },
        {
            testName: 'parameter index out of bounds',
            parameters: [p1],
            args: [arg2],
            expectedResult: [],
        },
        {
            testName: 'assigned twice',
            parameters: [p1],
            args: [arg1, arg3],
            expectedResult: [[p1, arg1]],
        },
    ];

    describe.each(testCases)('parametersToArguments', ({ testName, parameters, args, expectedResult }) => {
        it(testName, () => {
            const actualResult = [...nodeMapper.parametersToArguments(parameters, args)];
            expect(actualResult).toStrictEqual(expectedResult);
        });
    });
});

/**
 * A test case for {@link SafeDsNodeMapper.parametersToArguments}.
 */
interface ParametersToArgumentsTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The parameter to test.
     */
    parameters: TslParameter[];

    /**
     * The arguments to test.
     */
    args: TslArgument[];

    /**
     * The expected result.
     */
    expectedResult: [TslParameter, TslArgument][];
}
