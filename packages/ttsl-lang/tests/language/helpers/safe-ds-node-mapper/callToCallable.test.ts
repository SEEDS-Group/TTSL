import { describe, expect, it } from 'vitest';
import { isTslAbstractCall } from '../../../../src/language/generated/ast.js';
import { getNodeOfType } from '../../../helpers/nodeFinder.js';
import { NodeFileSystem } from 'langium/node';
import { createSafeDsServices } from '../../../../src/language/index.js';

const services = (await createSafeDsServices(NodeFileSystem)).SafeDs;
const nodeMapper = services.helpers.NodeMapper;

describe('SafeDsNodeMapper', () => {
    describe('callToCallable', () => {
        it('should return undefined if passed undefined', () => {
            expect(nodeMapper.callToCallable(undefined)).toBeUndefined();
        });

        // -----------------------------------------------------------------------------------------
        // Annotation calls
        // -----------------------------------------------------------------------------------------

        describe('annotation calls', () => {
            it('should return undefined if receiver is unresolved', async () => {
                const code = `
                    @unresolved
                    pipeline myPipeline {}
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBeUndefined();
            });

            it('should return the called annotation', async () => {
                const code = `
                    annotation MyAnnotation

                    @MyAnnotation
                    class MyClass
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslAnnotation');
            });
        });

        // -----------------------------------------------------------------------------------------
        // Calls
        // -----------------------------------------------------------------------------------------

        describe('calls', () => {
            it('should return undefined if receiver is unresolved', async () => {
                const code = `
                    pipeline myPipeline {
                        unresolved();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBeUndefined();
            });

            it('should return undefined if receiver is not callable', async () => {
                const code = `
                    enum MyEnum

                    pipeline myPipeline {
                        MyEnum();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBeUndefined();
            });

            it('should return the called annotation', async () => {
                const code = `
                    annotation MyAnnotation

                    pipeline myPipeline {
                        MyAnnotation();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslAnnotation');
            });

            it('should return the called annotation (aliased)', async () => {
                const code = `
                    annotation MyAnnotation

                    pipeline myPipeline {
                        val alias = MyAnnotation;
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslAnnotation');
            });

            it('should return the called block lambda (aliased)', async () => {
                const code = `
                    pipeline myPipeline {
                        val alias = () {};
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslBlockLambda');
            });

            it('should return the called callable type', async () => {
                const code = `
                    segment mySegment(f: () -> ()) {
                        f();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslCallableType');
            });

            it('should return the called callable type (aliased)', async () => {
                const code = `
                    segment mySegment(f: () -> ()) {
                        val alias = f;
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslCallableType');
            });

            it('should return the called class', async () => {
                const code = `
                    class MyClass

                    pipeline myPipeline {
                        MyClass();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslClass');
            });

            it('should return the called class (aliased)', async () => {
                const code = `
                    class MyClass

                    pipeline myPipeline {
                        val alias = MyClass;
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslClass');
            });

            it('should return the called enum variant', async () => {
                const code = `
                    enum MyEnum {
                        MyEnumVariant
                    }

                    pipeline myPipeline {
                        MyEnum.MyEnumVariant();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslEnumVariant');
            });

            it('should return undefined (aliased enum variant without parameter)', async () => {
                const code = `
                    enum MyEnum {
                        MyEnumVariant
                    }

                    pipeline myPipeline {
                        val alias = MyEnum.MyEnumVariant;
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)).toBeUndefined();
            });

            it('should return the called enum variant (aliased with parameter)', async () => {
                const code = `
                    enum MyEnum {
                        MyEnumVariant(p: Int)
                    }

                    pipeline myPipeline {
                        val alias = MyEnum.MyEnumVariant;
                        alias(1);
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslEnumVariant');
            });

            it('should return the called expression lambda (aliased)', async () => {
                const code = `
                    pipeline myPipeline {
                        val alias = () -> 0;
                        alias()
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslExpressionLambda');
            });

            it('should return the called function', async () => {
                const code = `
                    fun myFunction()

                    pipeline myPipeline {
                        myFunction();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslFunction');
            });

            it('should return the called function (aliased)', async () => {
                const code = `
                    fun myFunction()

                    pipeline myPipeline {
                        val alias = myFunction;
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslFunction');
            });

            it('should return the called segment', async () => {
                const code = `
                    segment mySegment() {}

                    pipeline myPipeline {
                        mySegment();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslSegment');
            });

            it('should return the called segment (aliased)', async () => {
                const code = `
                    segment mySegment() {}

                    pipeline myPipeline {
                        val alias = mySegment;
                        alias();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslSegment');
            });

            it('should ignore nullability (callable attribute, normal call)', async () => {
                const code = `
                    class MyClass {
                        attr myAttr: () -> ()
                    }

                    segment mySegment(
                        myClassOrNull: MyClass?
                    ) {
                        myClassOrNull?.myAttr();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslCallableType');
            });

            it('should ignore nullability (method, normal call)', async () => {
                const code = `
                    class MyClass {
                        fun myFunction()
                    }

                    segment mySegment(
                        myClassOrNull: MyClass?
                    ) {
                        myClassOrNull?.myFunction();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslFunction');
            });

            it('should ignore nullability (callable attribute, null-safe call)', async () => {
                const code = `
                    class MyClass {
                        attr myAttr: () -> ()
                    }

                    segment mySegment(
                        myClassOrNull: MyClass?
                    ) {
                        myClassOrNull?.myAttr?();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslCallableType');
            });

            it('should ignore nullability (method, null-safe call)', async () => {
                const code = `
                    class MyClass {
                        fun myFunction()
                    }

                    segment mySegment(
                        myClassOrNull: MyClass?
                    ) {
                        myClassOrNull?.myFunction?();
                    }
                `;

                const call = await getNodeOfType(services, code, isTslAbstractCall);
                expect(nodeMapper.callToCallable(call)?.$type).toBe('TslFunction');
            });
        });
    });
});
