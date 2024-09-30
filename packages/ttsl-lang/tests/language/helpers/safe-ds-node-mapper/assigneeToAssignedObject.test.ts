import { NodeFileSystem } from 'langium/node';
import { describe, expect, it } from 'vitest';
import {
    isTslAssignment,
    isTslPlaceholder,
    isTslResult,
    TslAssignee,
} from '../../../../src/language/generated/ast.js';
import { getAssignees } from '../../../../src/language/helpers/nodeProperties.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';
import { createTTSLServices } from '../../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const nodeMapper = services.helpers.NodeMapper;

describe('TTSLNodeMapper', () => {
    describe('assigneeToAssignedObject', () => {
        it('should return undefined if passed undefined', async () => {
            expect(nodeMapper.assigneeToAssignedObject(undefined)?.$type).toBeUndefined();
        });

        it.each([
            {
                name: 'no value',
                code: `
                    function f(){}

                    function myFunction() {
                        var a = f();
                    };
                `,
            },
            {
                name: 'only one value',
                code: `
                    function myFunction() {
                        var a = 1;
                    };
                `,
            },

            {
                name: 'unresolved receiver of call',
                code: `
                    function myFunction() {
                        var a = unresolved();
                    };
                `,
            },
        ])('should return undefined if nothing is assigned ($name)', async ({ code }) => {
            const placeholder = await getNodeOfType(services, code, isTslPlaceholder);
            expect(nodeMapper.assigneeToAssignedObject(placeholder)?.$type).toBeUndefined();
        });
        
        it('should return the entire RHS of an assignment if it is not a call (constant)', async () => {
            const code = `
                function myFunction() {
                    var a = 1;
                };
            `;

            const placeholder = await getNodeOfType(services, code, isTslPlaceholder);
            expect(nodeMapper.assigneeToAssignedObject(placeholder)?.$type).toBe('TslInt');
        });

        it('should return the entire RHS of an assignment if it is not a call (unresolved reference)', async () => {
            const code = `
                function myFunction() {
                    var a = unresolved;
                };
            `;

            const placeholder = await getNodeOfType(services, code, isTslPlaceholder);
            expect(nodeMapper.assigneeToAssignedObject(placeholder)?.$type).toBe('TslReference');
        });

        it.each([
            {
                name: 'function (one result)',
                code: `
                    function f(): Int {
                        var r1: Int = 0;
                        return r1;
                    }

                    function myFunction() {
                        var a = f();
                    };
                `,
                expected: ['r1'],
                index: undefined
            },
        ])(
            'should return the corresponding result if the RHS is a call of a $name',
            async ({ code, expected, index = 0 }) => {
                const assignment = await getNodeOfType(services, code, isTslAssignment, index);
                const abstractResultNames = getAssignees(assignment).map(abstractResultNameOrNull);
                expect(abstractResultNames).toStrictEqual(expected);
            },
        );

        const abstractResultNameOrNull = (node: TslAssignee): string | undefined => {
            const assignedObject = nodeMapper.assigneeToAssignedObject(node);
            if (!assignedObject) {
                return undefined;
            } else if (isTslResult(assignedObject)) {
                return assignedObject.name;
            } else {
                return assignedObject.$cstNode?.text;
            }
        };
    });
});
