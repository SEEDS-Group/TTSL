import { EmptyFileSystem } from 'langium';
import { describe, expect, it } from 'vitest';
import {
    isTslModule,
    TslAbstractCall,
    TslFunction,
    TslParameter,
    TslPipeline,
} from '../../../../src/language/generated/ast.js';
import { createSafeDsServices, getModuleMembers, getParameters } from '../../../../src/language/index.js';
import { Constant, IntConstant } from '../../../../src/language/partialEvaluation/model.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';

const services = (await createSafeDsServices(EmptyFileSystem, { omitBuiltins: true })).SafeDs;
const callGraphComputer = services.flow.CallGraphComputer;
const nodeMapper = services.helpers.NodeMapper;
const partialEvaluator = services.evaluation.PartialEvaluator;

const code = `
    fun myFunction(p1: String, p2: String = 0)

    pipeline myPipeline {
        myFunction(1, 2);
        myFunction();
        unresolved();
    }
`;
const module = await getNodeOfType(services, code, isTslModule);
const myFunction = getModuleMembers(module)[0] as TslFunction;
const p1 = getParameters(myFunction)[0]!;
const p2 = getParameters(myFunction)[1]!;
const myPipeline = module?.members[1] as TslPipeline;
const call1 = callGraphComputer.getAllContainedCalls(myPipeline)[0]!;
const call2 = callGraphComputer.getAllContainedCalls(myPipeline)[1]!;
const call3 = callGraphComputer.getAllContainedCalls(myPipeline)[2]!;

describe('SafeDsNodeMapper', () => {
    const testCases: CallToParameterValueTest[] = [
        {
            testName: 'undefined call, undefined parameter',
            call: undefined,
            parameter: undefined,
            expectedResult: undefined,
        },
        {
            testName: 'undefined call, defined parameter',
            call: undefined,
            parameter: p1,
            expectedResult: undefined,
        },
        {
            testName: 'defined call, undefined parameter',
            call: call1,
            parameter: undefined,
            expectedResult: undefined,
        },
        {
            testName: 'parameter is object, required parameter, value provided',
            call: call1,
            parameter: p1,
            expectedResult: new IntConstant(1n),
        },
        {
            testName: 'parameter is object, optional parameter, value provided',
            call: call1,
            parameter: p2,
            expectedResult: new IntConstant(2n),
        },
        {
            testName: 'parameter is object, required parameter, no value provided',
            call: call2,
            parameter: p1,
            expectedResult: undefined,
        },
        {
            testName: 'parameter is object, optional parameter, no value provided',
            call: call2,
            parameter: p2,
            expectedResult: new IntConstant(0n),
        },
        {
            testName: 'parameter is string, required parameter, value provided',
            call: call1,
            parameter: 'p1',
            expectedResult: new IntConstant(1n),
        },
        {
            testName: 'parameter is string, optional parameter, value provided',
            call: call1,
            parameter: 'p2',
            expectedResult: new IntConstant(2n),
        },
        {
            testName: 'parameter is string, required parameter, no value provided',
            call: call2,
            parameter: 'p1',
            expectedResult: undefined,
        },
        {
            testName: 'parameter is string, optional parameter, no value provided',
            call: call2,
            parameter: 'p2',
            expectedResult: new IntConstant(0n),
        },
        {
            testName: 'parameter is object, required parameter, unresolved callable',
            call: call3,
            parameter: p1,
            expectedResult: undefined,
        },
        {
            testName: 'parameter is object, optional parameter, unresolved callable',
            call: call3,
            parameter: p2,
            expectedResult: undefined,
        },
        {
            testName: 'parameter is string, required parameter, unresolved callable',
            call: call3,
            parameter: 'p1',
            expectedResult: undefined,
        },
        {
            testName: 'parameter is string, optional parameter, unresolved callable',
            call: call3,
            parameter: 'p2',
            expectedResult: undefined,
        },
    ];

    describe.each(testCases)('callToParameterValue', ({ testName, call, parameter, expectedResult }) => {
        it(testName, () => {
            const parameterValue = nodeMapper.callToParameterValue(call, parameter);
            if (expectedResult === undefined) {
                expect(parameterValue).toBeUndefined();
                return;
            }

            const evaluatedParameterValue = partialEvaluator.evaluate(parameterValue);
            expect(evaluatedParameterValue).toStrictEqual(expectedResult);
        });
    });
});

/**
 * A test case for {@link SafeDsNodeMapper.callToParameterValue}.
 */
interface CallToParameterValueTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The abstract call to test.
     */
    call: TslAbstractCall | undefined;

    /**
     * The parameter to test.
     */
    parameter: TslParameter | string | undefined;

    /**
     * The expected result.
     */
    expectedResult: Constant | undefined;
}
