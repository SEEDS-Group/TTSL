import { AstUtils, LangiumDocument, TreeStreamImpl, URI } from 'langium';
import {
    CompositeGeneratorNode,
    expandToNode,
    expandTracedToNode,
    joinToNode,
    joinTracedToNode,
    NL,
    toStringAndTrace,
    TraceRegion,
    traceToNode,
} from 'langium/generate';
import path from 'path';
import { SourceMapGenerator, StartOfSourceMap } from 'source-map';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { groupBy, isEmpty } from '../../helpers/collections.js';
import {
    isTslAssignment,
    isTslCall,
    isTslDeclaration,
    isTslExpressionStatement,
    isTslFunction,
    isTslIndexedAccess,
    isTslInfixOperation,
    isTslList,
    isTslDictionary,
    isTslModule,
    isTslPlaceholder,
    isTslPrefixOperation,
    isTslQualifiedImport,
    isTslReference,
    isTslTemplateString,
    isTslTemplateStringEnd,
    isTslTemplateStringInner,
    isTslTemplateStringPart,
    isTslTemplateStringStart,
    isTslWildcardImport,
    TslArgument,
    TslAssignee,
    TslAssignment,
    TslCall,
    TslDeclaration,
    TslExpression,
    TslModule,
    TslParameter,
    TslParameterList,
    TslPlaceholder,
    TslStatement,
    isTslConditionalStatement,
    isTslLoop,
    isTslForLoop,
    isTslForeachLoop,
    isTslWhileLoop,
    TslFunction,
    TslBlock,
    isTslAggregation,
    isTslTimespanStatement,
    isTslConstant,
    TslConstant,
    TslTimespan,
    TslTimeunit,
    isTslString,
    isTslParenthesizedExpression,
    isTslReturnStatement,
    isTslLiteral,
    isTslInt,
    isTslNull,
    isTslBoolean,
    isTslFloat,
    isTslTimeunit,
    isTslPredefinedFunction,
    TslType,
    isTslIntType,
    isTslFloatType,
    isTslListType,
    isTslDictionaryType,
    isTslBooleanType,
    isTslStringType,
    isTslExpression,
    isTslTypeAlias,
    isTslBlock,
    isTslData,
} from '../generated/ast.js';
import { isInFile, isFile } from '../helpers/fileExtensions.js';
import {
    getArguments,
    getAssignees,
    getImportedDeclarations,
    getImports,
    getModuleMembers,
    getParameters,
    getPlaceholderByName,
    getResults,
    getStatements,
    Parameter,
} from '../helpers/nodeProperties.js';
import { TTSLNodeMapper } from '../helpers/ttsl-node-mapper.js';
import { TTSLPartialEvaluator } from '../partialEvaluation/ttsl-partial-evaluator.js';
import { TTSLServices } from '../ttsl-module.js';
import { TTSLFunction } from '../builtins/ttsl-functions.js';
import { TTSLSlicer } from '../flow/ttsl-slicer.js';

export const CODEGEN_PREFIX = '__gen_';

const RUNNER_PACKAGE = 'TTSL_runner';
const PYTHON_INDENT = '    ';

const SPACING = new CompositeGeneratorNode(NL, NL);

const UTILITY_EAGER_OR: UtilityFunction = {
    name: `${CODEGEN_PREFIX}eager_or`,
    code: expandToNode`def ${CODEGEN_PREFIX}eager_or(left_operand: bool, right_operand: bool) -> bool:`
        .appendNewLine()
        .indent({ indentedChildren: ['return left_operand or right_operand'], indentation: PYTHON_INDENT }),
};

const UTILITY_EAGER_AND: UtilityFunction = {
    name: `${CODEGEN_PREFIX}eager_and`,
    code: expandToNode`def ${CODEGEN_PREFIX}eager_and(left_operand: bool, right_operand: bool) -> bool:`
        .appendNewLine()
        .indent({ indentedChildren: ['return left_operand and right_operand'], indentation: PYTHON_INDENT }),
};

const UTILITY_EAGER_ELVIS: UtilityFunction = {
    name: `${CODEGEN_PREFIX}eager_elvis`,
    code: expandToNode`def ${CODEGEN_PREFIX}eager_elvis(left_operand: ${CODEGEN_PREFIX}T, right_operand: ${CODEGEN_PREFIX}T) -> ${CODEGEN_PREFIX}T:`
        .appendNewLine()
        .indent({
            indentedChildren: ['return left_operand if left_operand is not None else right_operand'],
            indentation: PYTHON_INDENT,
        }),
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_NULL_SAFE_CALL: UtilityFunction = {
    name: `${CODEGEN_PREFIX}null_safe_call`,
    code: expandToNode`def ${CODEGEN_PREFIX}null_safe_call(receiver: Any, callable: Callable[[], ${CODEGEN_PREFIX}T]) -> ${CODEGEN_PREFIX}T | None:`
        .appendNewLine()
        .indent({
            indentedChildren: ['return callable() if receiver is not None else None'],
            indentation: PYTHON_INDENT,
        }),
    imports: [
        { importPath: 'typing', declarationName: 'Any' },
        { importPath: 'typing', declarationName: 'Callable' },
    ],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_NULL_SAFE_INDEXED_ACCESS: UtilityFunction = {
    name: `${CODEGEN_PREFIX}null_safe_indexed_access`,
    code: expandToNode`def ${CODEGEN_PREFIX}null_safe_indexed_access(receiver: Any, index: Any) -> ${CODEGEN_PREFIX}T | None:`
        .appendNewLine()
        .indent({
            indentedChildren: ['return receiver[index] if receiver is not None else None'],
            indentation: PYTHON_INDENT,
        }),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_AGGREGATION: UtilityFunction = {
    name: `${CODEGEN_PREFIX}aggregation`,
    code: expandToNode`def ${CODEGEN_PREFIX}aggregation(dataFrame: pd.Dataframe, data, id, function: str) -> pd.Dataframe | None:`
        .appendNewLine()
        .indent({
            indentedChildren: ['dataFrame = dataFrame.join(dataFrame[id])'],
            indentation: PYTHON_INDENT,
        })
        .appendNewLine()
        .indent({
            indentedChildren: ['dataFrame[data] = dataFrame.groupby(id)[data].transform(function)'],
            indentation: PYTHON_INDENT,
        })
        .appendNewLine()
        .indent({
            indentedChildren: ['return dataFrame'],
            indentation: PYTHON_INDENT,
        }),
    imports: [{ importPath: '', declarationName: 'pandas', alias: 'pd' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_CONSTANTS: UtilityFunction = {
    name: `${CODEGEN_PREFIX}ClassConstants`,
    code: expandToNode`class ${CODEGEN_PREFIX}ClassConstants():`.appendNewLine().indent((indentingNode) =>
        indentingNode
            .append('def __init__(self, dictionary: dict):')
            .appendNewLine()
            .indent({
                indentedChildren: ['self.dict = dictionary'],
                indentation: PYTHON_INDENT,
            })
            .appendNewLine()
            .append('def getValue(self, date = None):')
            .appendNewLine()
            .indent((indentingNode1) =>
                indentingNode1
                    .append('keys = sorted(self.dict.keys())')
                    .appendNewLine()
                    .append('if(keys[0] == "empty"):')
                    .appendNewLine()
                    .indent((indentingNode2) => indentingNode2.append('return self.dict["empty"]'))
                    .appendNewLine()
                    .append('for index, key in enumerate(keys):')
                    .appendNewLine()
                    .indent((indentingNode2) =>
                        indentingNode2
                            .append('if key[0] == "s":')
                            .appendNewLine()
                            .indent((indentingNode3) =>
                                indentingNode3
                                    .append('if key.replace("s", "") <= date:')
                                    .appendNewLine()
                                    .indent((indentingNode4) => indentingNode4.append('result = self.dict[key]')),
                            )
                            .appendNewLine()
                            .append('if key[0] == "e":')
                            .appendNewLine()
                            .indent((indentingNode3) =>
                                indentingNode3
                                    .append('if date <= keys[len(keys)-1-index].replace("e", ""):')
                                    .appendNewLine()
                                    .indent((indentingNode4) =>
                                        indentingNode4
                                            .append('result = self.dict[keys[len(keys)-1-index]]')
                                            .appendNewLine(),
                                    ),
                            ),
                    )
                    .append('return result'),
            ),
    ),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_TIMEUNIT_DAY: UtilityFunction = {
    name: `${CODEGEN_PREFIX}TimeUnitDay`,
    code: expandToNode`def ${CODEGEN_PREFIX}TimeUnitDay(value, timeunit):`
        .appendNewLine()
        .indent((indentingNode) =>
            indentingNode
                .append(`if(timeunit == 'week'):`)
                .appendNewLine()
                .indent([`return value * 7`])
                .appendNewLine()
                .append(`if(timeunit == 'month'):`)
                .appendNewLine()
                .indent([`return value * 30`])
                .appendNewLine()
                .append(`if(timeunit == 'year'):`)
                .appendNewLine()
                .indent([`return value * 365`])
                .appendNewLine()
                .append(`return value`),
        ),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_TIMEUNIT_WEEK: UtilityFunction = {
    name: `${CODEGEN_PREFIX}TimeUnitWeek`,
    code: expandToNode`def ${CODEGEN_PREFIX}TimeUnitWeek(value, timeunit):`
        .appendNewLine()
        .indent((indentingNode) =>
            indentingNode
                .append(`if(timeunit == 'day'):`)
                .appendNewLine()
                .indent([`return value / 7`])
                .appendNewLine()
                .append(`if(timeunit == 'month'):`)
                .appendNewLine()
                .indent([`return value * 4`])
                .appendNewLine()
                .append(`if(timeunit == 'year'):`)
                .appendNewLine()
                .indent([`return value * 52`])
                .appendNewLine()
                .append(`return value`),
        ),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_TIMEUNIT_MONTH: UtilityFunction = {
    name: `${CODEGEN_PREFIX}TimeUnitMonth`,
    code: expandToNode`def ${CODEGEN_PREFIX}TimeUnitMonth(value, timeunit):`
        .appendNewLine()
        .indent((indentingNode) =>
            indentingNode
                .append(`if(timeunit == 'day'):`)
                .appendNewLine()
                .indent([`return value / 30`])
                .appendNewLine()
                .append(`if(timeunit == 'week'):`)
                .appendNewLine()
                .indent([`return value / 4`])
                .appendNewLine()
                .append(`if(timeunit == 'year'):`)
                .appendNewLine()
                .indent([`return value * 12`])
                .appendNewLine()
                .append(`return value`),
        ),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_TIMEUNIT_YEAR: UtilityFunction = {
    name: `${CODEGEN_PREFIX}TimeUnitYear`,
    code: expandToNode`def ${CODEGEN_PREFIX}TimeUnitYear(value, timeunit):`
        .appendNewLine()
        .indent((indentingNode) =>
            indentingNode
                .append(`if(timeunit == 'day'):`)
                .appendNewLine()
                .indent([`return value / 365`])
                .appendNewLine()
                .append(`if(timeunit == 'week'):`)
                .appendNewLine()
                .indent([`return value / 52`])
                .appendNewLine()
                .append(`if(timeunit == 'month'):`)
                .appendNewLine()
                .indent([`return value / 12`])
                .appendNewLine()
                .append(`return value`),
        ),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_LEN_FUNCTION: UtilityFunction = {
    name: `${CODEGEN_PREFIX}len`,
    code: expandToNode`def ${CODEGEN_PREFIX}len(list):`
        .appendNewLine()
        .indent((indentingNode) => indentingNode.append(`return len(list)`)),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_KEYS_FUNCTION: UtilityFunction = {
    name: `${CODEGEN_PREFIX}keys`,
    code: expandToNode`def ${CODEGEN_PREFIX}keys(dict):`
        .appendNewLine()
        .indent((indentingNode) => indentingNode.append(`return list(dict.keys())`)),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

const UTILITY_VALUES_FUNCTION: UtilityFunction = {
    name: `${CODEGEN_PREFIX}values`,
    code: expandToNode`def ${CODEGEN_PREFIX}values(dict):`
        .appendNewLine()
        .indent((indentingNode) => indentingNode.append(`return list(dict.values())`)),
    imports: [{ importPath: 'typing', declarationName: 'Any' }],
    typeVariables: [`${CODEGEN_PREFIX}T`],
};

export class TTSLPythonGenerator {
    private readonly builtinFunction: TTSLFunction;
    private readonly nodeMapper: TTSLNodeMapper;
    private readonly partialEvaluator: TTSLPartialEvaluator;
    private readonly slicer: TTSLSlicer;

    constructor(services: TTSLServices) {
        this.builtinFunction = services.builtins.Functions;
        this.nodeMapper = services.helpers.NodeMapper;
        this.partialEvaluator = services.evaluation.PartialEvaluator;
        this.slicer = services.flow.Slicer;
    }

    generate(document: LangiumDocument, generateOptions: GenerateOptions, params: string[] = []): TextDocument[] {
        const node = document.parseResult.value;
        const inputPath = path.parse(document.uri.fsPath);

        // Do not generate stub files
        if (!isFile(document) || !isTslModule(node)) {
            return [];
        }

        const name = path.parse(document.uri.fsPath).name;
        const pythonModuleName = this.builtinFunction.getPythonModule(node);
        const packagePath = pythonModuleName === undefined ? node.name.split('.') : [pythonModuleName];
        const parentDirectoryPath = path.join(generateOptions.destination!.fsPath, ...packagePath);

        const generatedFiles = new Map<string, string>();
        const generatedModule = this.generateModule(node, generateOptions, inputPath, params);
        const { text, trace } = toStringAndTrace(generatedModule);
        const pythonOutputPath = `${path.join(parentDirectoryPath, this.formatGeneratedFileName(name))}.py`;
        if (generateOptions.createSourceMaps) {
            generatedFiles.set(
                `${pythonOutputPath}.map`,
                this.generateSourceMap(document, text, trace, this.formatGeneratedFileName(name)),
            );
        }
        generatedFiles.set(pythonOutputPath, text);
        for (const funct of getModuleMembers(node).filter(isTslFunction)) {
            const entryPointFilename = `${path.join(
                parentDirectoryPath,
                `${this.formatGeneratedFileName(name)}_${this.getPythonNameOrDefault(funct)}`,
            )}.py`;
            const entryPointContent = expandTracedToNode(funct)`from ${this.formatGeneratedFileName(
                name,
            )} import ${this.getPythonNameOrDefault(
                funct,
            )}\n\nif __name__ == '__main__':\n${PYTHON_INDENT}${this.getPythonNameOrDefault(funct)}()`.appendNewLine();
            const generatedFunctionEntry = toStringAndTrace(entryPointContent);
            generatedFiles.set(entryPointFilename, generatedFunctionEntry.text);
        }
        const entryPointFilename = `${path.join(
            parentDirectoryPath,
            `${this.formatGeneratedFileName(name)}_simulate`,
        )}.py`;
        const entryPointContent = expandToNode`from ${this.formatGeneratedFileName(
            name,
        )} import simulate\n\nif __name__ == '__main__':\n${PYTHON_INDENT}print(simulate())`.appendNewLine();
        const generatedFunctionEntry = toStringAndTrace(entryPointContent);
        generatedFiles.set(entryPointFilename, generatedFunctionEntry.text);

        return Array.from(generatedFiles.entries()).map(([fsPath, content]) =>
            TextDocument.create(URI.file(fsPath).toString(), 'py', 0, content),
        );
    }

    private generateSourceMap(
        document: LangiumDocument,
        generatedText: String,
        trace: TraceRegion,
        generatedFileName: string,
    ): string {
        const sourceTextFull = document.textDocument.getText();
        const mapper: SourceMapGenerator = new SourceMapGenerator(<StartOfSourceMap>{
            file: `${generatedFileName}.py`,
        });
        // Use only the filename (and extension) in the source map
        const inputPath = path.parse(document.uri.fsPath);
        const inputFile = `${inputPath.name}${inputPath.ext}`;

        new TreeStreamImpl(trace, (r) => r.children ?? [], { includeRoot: true }).forEach((r) => {
            if (!r.sourceRegion || !r.targetRegion || r.children?.[0]?.targetRegion.offset === r.targetRegion.offset) {
                return;
            }
            const sourceStart = r.sourceRegion.range?.start;
            const targetStart = r.targetRegion.range?.start;
            const sourceEnd = r.sourceRegion?.range?.end;
            const sourceText =
                sourceEnd && sourceTextFull.length >= r.sourceRegion.end
                    ? sourceTextFull.substring(r.sourceRegion.offset, r.sourceRegion.end)
                    : /* c8 ignore next */
                      '';
            if (sourceStart && targetStart) {
                mapper.addMapping({
                    original: { line: sourceStart.line + 1, column: sourceStart.character },
                    generated: { line: targetStart.line + 1, column: targetStart.character },
                    source: inputFile,
                    name: /^[_a-zA-Z][_a-zA-Z0-9]*$/u.test(sourceText) ? sourceText.toLowerCase() : undefined,
                });
            }
            const targetEnd = r.targetRegion?.range?.end;
            const targetText =
                targetEnd && generatedText.length >= r.targetRegion.end
                    ? generatedText.substring(r.targetRegion.offset, r.targetRegion.end)
                    : /* c8 ignore next */
                      '';
            if (
                sourceEnd &&
                targetEnd &&
                !r.children &&
                sourceText &&
                targetText &&
                !/\s/u.test(sourceText) &&
                !/\s/u.test(targetText)
            ) {
                mapper.addMapping({
                    original: { line: sourceEnd.line + 1, column: sourceEnd.character },
                    generated: { line: targetEnd.line + 1, column: targetEnd.character },
                    source: inputFile,
                });
            }
        });
        return mapper.toString();
    }

    private getPythonModuleOrDefault(object: TslModule) {
        return this.builtinFunction.getPythonModule(object) || object.name;
    }

    private getPythonNameOrDefault(object: TslDeclaration) {
        if (isTslConstant(object)) {
            return object.name + '.getValue(date)';
        }
        return this.builtinFunction.getPythonName(object) || object.name;
    }

    private getQualifiedNamePythonCompatible(node: TslDeclaration | undefined): string | undefined {
        const segments = [];

        let current: TslDeclaration | undefined = node;
        while (current) {
            const currentName = isTslModule(current)
                ? this.getPythonModuleOrDefault(current)
                : this.getPythonNameOrDefault(current);
            if (currentName) {
                segments.unshift(currentName);
            }
            current = AstUtils.getContainerOfType(current.$container, isTslDeclaration);
        }

        return segments.join('.');
    }

    private formatGeneratedFileName(baseName: string): string {
        return `gen_${this.sanitizeModuleNameForPython(baseName)}`;
    }

    sanitizeModuleNameForPython(moduleName: string): string {
        return moduleName.replaceAll('%2520', '_').replaceAll(/[ .-]/gu, '_').replaceAll(/\\W/gu, '');
    }

    private generateModule(
        module: TslModule,
        generateOptions: GenerateOptions,
        inputPath: path.ParsedPath,
        params: string[] = [],
    ): CompositeGeneratorNode {
        const importSet = new Map<String, ImportData>();
        const utilitySet = new Set<UtilityFunction>();
        const typeVariableSet = new Set<string>();

        const functions = getModuleMembers(module)
            .filter(isTslFunction)
            .map((funct) => this.generateFunction(funct, importSet, utilitySet, typeVariableSet, generateOptions));
        const constants = getModuleMembers(module)
            .filter(isTslConstant)
            .map((constant) =>
                this.generateConstant(constant, importSet, utilitySet, typeVariableSet, generateOptions),
            );
        const imports = this.generateImports(Array.from(importSet.values()));
        const output = new CompositeGeneratorNode();
        output.trace(module);
        output.append('# Imports ----------------------------------------------------------------------');
        output.appendNewLine();
        output.appendNewLine();
        output.append(
            `from gettsim import (compute_taxes_and_transfers, create_synthetic_data, set_up_policy_environment)\nimport pandas as pd\n`,
        );
        output.append(`import numpy as np`);
        output.appendNewLine();
        if (imports.length > 0) {
            output.append(joinToNode(imports, (importDecl) => importDecl, { separator: NL }));
            output.appendNewLine();
        }
        if (typeVariableSet.size > 0) {
            output.appendNewLineIf(imports.length > 0);
            output.append('# Type variables ---------------------------------------------------------------');
            output.appendNewLine();
            output.appendNewLine();
            output.append(joinToNode(typeVariableSet, (typeVar) => `${typeVar} = TypeVar("${typeVar}")`));
            output.appendNewLine();
        }
        if (utilitySet.size > 0) {
            output.appendNewLineIf(imports.length > 0 || typeVariableSet.size > 0);
            output.append('# Utils ------------------------------------------------------------------------');
            output.appendNewLine();
            output.appendNewLine();
            output.append(joinToNode(utilitySet, (importDecl) => importDecl.code, { separator: SPACING }));
            output.appendNewLine();
        }
        if (functions.length > 0) {
            output.appendNewLineIf(imports.length > 0 || typeVariableSet.size > 0 || utilitySet.size > 0);
            output.append('# Functions --------------------------------------------------------------------');
            output.appendNewLine();
            output.appendNewLine();
            output.append(joinToNode(functions, (funct) => funct, { separator: SPACING }));
            output.appendNewLine();
        }
        if (constants.length > 0) {
            output.appendNewLineIf(
                imports.length > 0 || typeVariableSet.size > 0 || utilitySet.size > 0 || functions.length > 0,
            );
            output.append('# Constants --------------------------------------------------------------------');
            output.appendNewLine();
            output.appendNewLine();
            output.append(joinToNode(constants, (constant) => constant, { separator: SPACING }));
            output.appendNewLine();
        }
        let simulateParams = params;
        if (simulateParams.length !== 3) {
            simulateParams = ['2000-01-01', 'dataFile.csv', "['target1', 'target2']"];
        }
        output
            .appendNewLine()
            .append(`# Simulation --------------------------------------------------------------------`)
            .appendNewLine()
            .appendNewLine()
            .append(expandToNode`date = "${simulateParams[0]}"`)
            .appendNewLine()
            .appendNewLine()
            .append(
                expandToNode`functions = {${joinToNode(
                    getModuleMembers(module)
                        .filter(isTslFunction)
                        .filter((funct) => funct.visibility?.isPublic || !funct.visibility)
                        .map((funct) => funct.name),
                    (functName) => expandToNode`'${functName}': ${functName}`,
                    { separator: ', ' },
                )}}`,
            )
            .appendNewLine()
            .appendNewLine()
            .append(`params = {'${inputPath.name}':{`)
            .append(
                expandToNode`${joinToNode(
                    getModuleMembers(module)
                        .filter(isTslConstant)
                        .map((constant) => constant.name),
                    (constName) => `'${constName}': ${constName}.getValue(date)`,
                    { separator: ', ' },
                )}}}`,
            )
            .appendNewLine()
            .appendNewLine()
            .append(`def simulate() -> pd.DataFrame:`)
            .appendNewLine()
            .indent({
                indentedChildren: [
                    `return compute_taxes_and_transfers(data = pd.read_csv("${simulateParams[1]?.replaceAll('\\', '\\\\')}"), targets = ${simulateParams[2]}, functions = functions, params = params)`,
                ],
                indentation: PYTHON_INDENT,
            });
        return output;
    }

    private generateFunction(
        funct: TslFunction,
        importSet: Map<String, ImportData>,
        utilitySet: Set<UtilityFunction>,
        typeVariableSet: Set<string>,
        generateOptions: GenerateOptions,
    ): CompositeGeneratorNode {
        const infoFrame = new GenerationInfoFrame(
            importSet,
            utilitySet,
            typeVariableSet,
            true,
            generateOptions.targetPlaceholder,
            generateOptions.disableRunnerIntegration,
        );

        return expandTracedToNode(funct)`def ${traceToNode(
            funct,
            'name',
        )(this.getPythonNameOrDefault(funct))}(${this.containedData(funct, infoFrame)}`
            .append(expandToNode`${this.generateParameters(funct.parameterList, infoFrame)}`)
            .append(expandToNode`${this.generateFunctionParameter(funct)})`)
            .appendIf(
                funct.result !== undefined,
                expandToNode`->${this.generateType(funct.result?.type, infoFrame, true)}`,
            )
            .append(`:`)
            .appendNewLine()
            .indent({
                indentedChildren: [this.generateBlock(funct.body, infoFrame, funct.timeunit)],
                indentation: PYTHON_INDENT,
            });
    }

    private generateBlock(
        block: TslBlock,
        frame: GenerationInfoFrame,
        timeunit: TslTimeunit | undefined,
    ): CompositeGeneratorNode {
        let statements = getStatements(block);
        if (frame.targetPlaceholder) {
            const targetPlaceholders = frame.targetPlaceholder.flatMap((it) => getPlaceholderByName(block, it) ?? []);
            if (!isEmpty(targetPlaceholders)) {
                statements = this.slicer.computeBackwardSlice(statements, targetPlaceholders);
            }
        }
        if (statements.length === 0) {
            return traceToNode(block)('pass');
        }

        return joinTracedToNode(block, 'statements')(
            statements,
            (stmt) => {
                if (isTslReturnStatement(stmt)) {
                    let resultBlock = new CompositeGeneratorNode();
                    if (isTslTimeunit(timeunit)) {
                        resultBlock.append(`if timeunit != None:`);
                        if (timeunit?.timeunit === 'day') {
                            frame.addUtility(UTILITY_TIMEUNIT_DAY);
                            resultBlock
                                .appendNewLine()
                                .indent([
                                    expandToNode`result = ${UTILITY_TIMEUNIT_DAY.name}(${this.generateExpression(stmt.result, frame)}, timeunit)`,
                                ])
                                .appendNewLine();
                        } else if (timeunit?.timeunit === 'week') {
                            frame.addUtility(UTILITY_TIMEUNIT_WEEK);
                            resultBlock
                                .appendNewLine()
                                .indent([
                                    expandToNode`result = ${UTILITY_TIMEUNIT_WEEK.name}(${this.generateExpression(stmt.result, frame)}, timeunit)`,
                                ])
                                .appendNewLine();
                        } else if (timeunit?.timeunit === 'month') {
                            frame.addUtility(UTILITY_TIMEUNIT_MONTH);
                            resultBlock
                                .appendNewLine()
                                .indent([
                                    expandToNode`result = ${UTILITY_TIMEUNIT_MONTH.name}(${this.generateExpression(stmt.result, frame)}, timeunit)`,
                                ])
                                .appendNewLine();
                        } else if (timeunit?.timeunit === 'year') {
                            frame.addUtility(UTILITY_TIMEUNIT_YEAR);
                            resultBlock
                                .appendNewLine()
                                .indent([
                                    expandToNode`result = ${UTILITY_TIMEUNIT_YEAR.name}(${this.generateExpression(stmt.result, frame)}, timeunit)`,
                                ])
                                .appendNewLine();
                        }
                        resultBlock.append(expandToNode`return result`);
                    } else {
                        resultBlock.append(expandToNode`return ${this.generateExpression(stmt.result, frame)}`);
                    }
                    return resultBlock;
                } else {
                    return this.generateStatement(stmt, timeunit, frame);
                }
            },
            {
                separator: NL,
            },
        )!;
    }

    private generateConstant(
        constant: TslConstant,
        importSet: Map<String, ImportData>,
        utilitySet: Set<UtilityFunction>,
        typeVariableSet: Set<string>,
        generateOptions: GenerateOptions,
    ): CompositeGeneratorNode | undefined {
        const infoFrame = new GenerationInfoFrame(
            importSet,
            utilitySet,
            typeVariableSet,
            true,
            generateOptions.targetPlaceholder,
            generateOptions.disableRunnerIntegration,
        );
        infoFrame.addUtility(UTILITY_CONSTANTS);

        if (constant.value) {
            return expandTracedToNode(constant)`${constant.name} = ${traceToNode(constant)(
                UTILITY_CONSTANTS.name,
            )}({"empty": ${this.generateExpression(constant.value, infoFrame)}})`;
        } else if (constant.timespanValueEntries) {
            return expandTracedToNode(constant)`${constant.name}Dict = {${joinTracedToNode(
                constant,
                'timespanValueEntries',
            )(
                constant.timespanValueEntries,
                (entry) =>
                    expandTracedToNode(entry)`${traceToNode(
                        entry,
                        'timespan',
                    )(this.generateDateString(entry.timespan))}: ${traceToNode(
                        entry,
                        'value',
                    )(this.generateExpression(entry.value, infoFrame))}`,
                { separator: ', ' },
            )}}`
                .appendNewLine()
                .append(
                    expandTracedToNode(constant)`${constant.name} = ${traceToNode(constant)(
                        UTILITY_CONSTANTS.name,
                    )}(${constant.name}Dict)`,
                );
        } else {
            return undefined;
        }
    }

    private generateDateString(timespan: TslTimespan): CompositeGeneratorNode | undefined {
        if (timespan.start) {
            return expandToNode`"s${timespan.start.date}"`; // add 's' to mark that it's the start of the timespan
        } else if (timespan.end) {
            return expandToNode`"e${timespan.end.date}"`; // add 'e' to mark that it's the end of the timespan
        } else {
            /* c8 ignore next 2 */
            return undefined;
        }
    }

    private containedData(funct: TslFunction, frame: GenerationInfoFrame): CompositeGeneratorNode | undefined {
        let result = new CompositeGeneratorNode();

        let datas = AstUtils.streamAllContents(funct).flatMap((it) => {
            if (isTslReference(it) && isTslData(it.target.ref)) {
                return [it.target.ref];
            } else {
                return [];
            }
        });
        if (datas.isEmpty()) {
            return undefined;
        }

        datas = datas.distinct();

        datas.forEach((data) => {
            result.append(expandToNode`${data.name}`.append(expandToNode`${this.generateType(data.type, frame)}, `));
        });

        return result;
    }

    private generateParameters(
        parameters: TslParameterList | undefined,
        frame: GenerationInfoFrame,
    ): CompositeGeneratorNode | undefined {
        if (!parameters) {
            /* c8 ignore next 2 */
            return undefined;
        }
        return joinTracedToNode(parameters, 'parameters')(
            parameters?.parameters || [],
            (param) =>
                expandToNode`${this.generateParameter(param)}`
                    .append(expandToNode`${this.generateType(param.type, frame)}`)
                    .append(expandToNode`${this.generateDefaultValue(param.defaultValue, frame)}`),
            { separator: ', ' },
        );
    }

    private generateParameter(parameter: TslParameter): CompositeGeneratorNode {
        return expandTracedToNode(parameter)`${this.getPythonNameOrDefault(parameter)}`;
    }

    private generateType(
        type: TslType | undefined,
        frame: GenerationInfoFrame,
        rekursion: boolean = false,
    ): CompositeGeneratorNode {
        let result = new CompositeGeneratorNode();
        if (!rekursion) {
            result.append(`: `);
        }

        if (isTslIntType(type)) {
            return result.append(`int`);
        } else if (isTslFloatType(type)) {
            return result.append(`float`);
        } else if (isTslBooleanType(type)) {
            return result.append(`bool`);
        } else if (isTslStringType(type)) {
            return result.append(`str`);
        } else if (isTslListType(type)) {
            return result.append(
                expandToNode`list[${this.generateType(type.typeParameterList.typeParameters.at(0)?.type, frame, true)}]`,
            );
        } else if (isTslDictionaryType(type)) {
            return result.append(
                expandToNode`dict[${this.generateType(type.typeParameterList.typeParameters.at(0)?.type, frame, true)}, ${this.generateType(type.typeParameterList.typeParameters.at(1)?.type, frame, true)}]`,
            );
        } else if (isTslReference(type)) {
            return this.generateExpression(type, frame);
        } else {
            return new CompositeGeneratorNode(``);
        }
    }

    private generateDefaultValue(value: TslExpression | undefined, frame: GenerationInfoFrame): CompositeGeneratorNode {
        let result = new CompositeGeneratorNode();
        if (isTslExpression(value)) {
            return result.append(expandToNode` = ${this.generateExpression(value, frame).contents}`);
        } else {
            return result;
        }
    }

    private generateImports(importSet: ImportData[]): string[] {
        const qualifiedImports = importSet
            .filter((importStmt) => importStmt.declarationName === undefined)
            .sort((a, b) => a.importPath.localeCompare(b.importPath))
            .map(this.generateQualifiedImport);
        const groupedImports = groupBy(
            importSet.filter((importStmt) => importStmt.declarationName !== undefined),
            (importStmt) => importStmt.importPath,
        )
            .toArray()
            .sort(([key1, _value1], [key2, _value2]) => key1.localeCompare(key2));
        const declaredImports: string[] = [];
        for (const [key, value] of groupedImports) {
            const importedDecls =
                value
                    ?.filter((importData) => importData !== undefined)
                    .sort((a, b) => a.declarationName!.localeCompare(b.declarationName!))
                    .map((localValue) =>
                        localValue.alias !== undefined
                            ? `${localValue.declarationName} as ${localValue.alias}`
                            : localValue.declarationName!,
                    ) || [];
            if (key === '') {
                declaredImports.push(`import ${[...new Set(importedDecls)].join(', ')}`);
            } else {
                declaredImports.push(`from ${key} import ${[...new Set(importedDecls)].join(', ')}`);
            }
        }
        return [...new Set(qualifiedImports), ...new Set(declaredImports)];
    }

    private generateQualifiedImport(importStmt: ImportData): string {
        if (importStmt.alias === undefined) {
            return `import ${importStmt.importPath}`;
        } else {
            /* c8 ignore next 2 */
            return `import ${importStmt.importPath} as ${importStmt.alias}`;
        }
    }

    private getStatementsNeededForPartialExecution(
        targetPlaceholder: TslPlaceholder,
        statementsWithEffect: TslStatement[],
    ): TslStatement[] {
        // Find assignment of placeholder, to search used placeholders and impure dependencies
        const assignment = AstUtils.getContainerOfType(targetPlaceholder, isTslAssignment);
        if (!assignment || !assignment.expression) {
            /* c8 ignore next 2 */
            throw new Error(`No assignment for placeholder: ${targetPlaceholder.name}`);
        }
        // All collected referenced placeholders that are needed for calculating the target placeholder. An expression in the assignment will always exist here
        const referencedPlaceholders = new Set<TslPlaceholder>(
            AstUtils.streamAllContents(assignment.expression!)
                .filter(isTslReference)
                .filter((reference) => isTslPlaceholder(reference.target.ref))
                .map((reference) => <TslPlaceholder>reference.target.ref!)
                .toArray(),
        );
        const collectedStatements: TslStatement[] = [assignment];
        for (const prevStatement of statementsWithEffect.reverse()) {
            // Statements after the target assignment can always be skipped
            if (prevStatement.$containerIndex! >= assignment.$containerIndex!) {
                continue;
            }
            if (
                // Placeholder is relevant
                isTslAssignment(prevStatement) &&
                getAssignees(prevStatement)
                    .filter(isTslPlaceholder)
                    .some((prevPlaceholder) => referencedPlaceholders.has(prevPlaceholder))
            ) {
                collectedStatements.push(prevStatement);
                // Collect all referenced placeholders
                if (isTslExpressionStatement(prevStatement) || isTslAssignment(prevStatement)) {
                    AstUtils.streamAllContents(prevStatement.expression!)
                        .filter(isTslReference)
                        .filter((reference) => isTslPlaceholder(reference.target.ref))
                        .map((reference) => <TslPlaceholder>reference.target.ref!)
                        .forEach((prevPlaceholder) => {
                            referencedPlaceholders.add(prevPlaceholder);
                        });
                }
            }
        }
        // Get all statements in sorted order
        return collectedStatements.reverse();
    }

    private generateStatement(
        statement: TslStatement,
        timeunit: TslTimeunit | undefined,
        frame: GenerationInfoFrame,
    ): CompositeGeneratorNode {
        const code: CompositeGeneratorNode[] = [];
        if (isTslAssignment(statement)) {
            code.push(this.generateAssignment(statement, frame));
            return joinTracedToNode(statement)(code, (stmt) => stmt, {
                separator: NL,
            })!;
        } else if (isTslExpressionStatement(statement)) {
            code.push(this.generateExpression(statement.expression, frame));
            return joinTracedToNode(statement)(code, (stmt) => stmt, {
                separator: NL,
            })!;
        } else if (isTslTimespanStatement(statement)) {
            var start = '';
            var end = '';
            if (statement.timespan.start) {
                start = `"` + statement.timespan.start.date + `" <=`;
            }
            if (statement.timespan.end) {
                end = `< "` + statement.timespan.end.date + `"`;
            }
            if (!statement.timespan.start && !statement.timespan.end) {
                throw new Error(`Timespan has neither a start nor an end value`);
            }

            if (end === '' && isTslBlock(statement.$container)) {
                // calculate the missing end date
                let index = statement.$container.statements.filter(isTslTimespanStatement).indexOf(statement);
                let following = statement.$container.statements.filter(isTslTimespanStatement).at(index + 1);
                if (following) {
                    end = `< "${following?.timespan.start?.date!}"`;
                }
            }
            if (start === '' && isTslBlock(statement.$container)) {
                // calculate the missing start date
                let index = statement.$container.statements.filter(isTslTimespanStatement).indexOf(statement);
                let previous = statement.$container.statements.filter(isTslTimespanStatement).at(index - 1);
                if (previous) {
                    start = `"${previous?.timespan.end?.date!}" <=`;
                }
            }
            return expandTracedToNode(statement)`if ${start} date ${end}:`
                .appendNewLine()
                .indent((indentingNode) => indentingNode.append(this.generateBlock(statement.block, frame, timeunit)));
        } else if (isTslConditionalStatement(statement)) {
            let elseBlock = new CompositeGeneratorNode();
            if (isTslBlock(statement.elseBlock)) {
                let generatedBlock = this.generateBlock(statement.elseBlock, frame, timeunit);
                elseBlock
                    .append(`else:`)
                    .appendNewLine()
                    .indent((indentingNode) => indentingNode.append(generatedBlock));
            }
            return expandTracedToNode(statement)`if (${this.generateExpression(statement.expression, frame)}):`
                .appendNewLine()
                .indent((indentingNode) => indentingNode.append(this.generateBlock(statement.ifBlock, frame, timeunit)))
                .appendNewLine()
                .append(elseBlock);
        } else if (isTslLoop(statement)) {
            if (isTslWhileLoop(statement)) {
                return expandTracedToNode(statement)`while ${this.generateExpression(statement.condition, frame)}:`
                    .appendNewLine()
                    .indent((indentingNode) =>
                        indentingNode.append(this.generateBlock(statement.block, frame, timeunit)),
                    );
            } else if (isTslForLoop(statement)) {
                let firstParameter,
                    thirdParameter = new CompositeGeneratorNode();
                if (statement.definitionStatement) {
                    firstParameter = this.generateStatement(statement.definitionStatement, timeunit, frame);
                }
                if (statement.iteration) {
                    thirdParameter = this.generateStatement(statement.iteration, timeunit, frame);
                }
                return expandTracedToNode(statement)`${firstParameter}
while ${this.generateExpression(statement.condition, frame)}:`
                    .appendNewLine()
                    .indent((indentingNode) =>
                        indentingNode
                            .append(this.generateBlock(statement.block, frame, timeunit))
                            .append(thirdParameter),
                    );
            } else if (isTslForeachLoop(statement)) {
                return expandTracedToNode(
                    statement,
                )`for ${statement.element.name} in ${this.generateExpression(statement.list, frame).contents}:`
                    .appendNewLine()
                    .indent((indentingNode) =>
                        indentingNode.append(this.generateBlock(statement.block, frame, timeunit)),
                    );
            }
        } else if (isTslReturnStatement(statement)) {
            return expandTracedToNode(statement)`return ${this.generateExpression(statement.result, frame)}`;
        }
        /* c8 ignore next 2 */
        throw new Error(`Unknown TslStatement: ${statement}`);
    }

    private generateAssignment(assignment: TslAssignment, frame: GenerationInfoFrame): CompositeGeneratorNode {
        const requiredAssignees = isTslFunction(assignment.expression)
            ? getResults(assignment.expression).length
            : /* c8 ignore next */
              1;
        const assignees = getAssignees(assignment);
        const actualAssignees = assignees.map(this.generateAssignee);
        const assignmentStatements = [];
        if (requiredAssignees === actualAssignees.length) {
            assignmentStatements.push(
                expandTracedToNode(assignment)`${joinToNode(actualAssignees, (actualAssignee) => actualAssignee, {
                    separator: ', ',
                })} = ${this.generateExpression(assignment.expression!, frame)}`,
            );
        }

        return joinTracedToNode(assignment)(assignmentStatements, (stmt) => stmt, {
            separator: NL,
        })!;
    }

    private generateAssignee(assignee: TslAssignee): CompositeGeneratorNode {
        if (isTslPlaceholder(assignee)) {
            return traceToNode(assignee)(assignee.name);
        } else if (isTslReference(assignee)) {
            return traceToNode(assignee)(assignee.target.ref?.name);
        }
        /* c8 ignore next 2 */
        throw new Error(`Unknown TslAssignment: ${assignee.$type}`);
    }

    private generateExpression(expression: TslExpression, frame: GenerationInfoFrame): CompositeGeneratorNode {
        if (isTslTemplateStringPart(expression)) {
            if (isTslTemplateStringStart(expression)) {
                return expandTracedToNode(expression)`${this.formatStringSingleLine(expression.value)}{ `;
            } else if (isTslTemplateStringInner(expression)) {
                return expandTracedToNode(expression)` }${this.formatStringSingleLine(expression.value)}{ `;
            } else if (isTslTemplateStringEnd(expression)) {
                return expandTracedToNode(expression)` }${this.formatStringSingleLine(expression.value)}`;
            }
        }

        // Handled after constant expressions: List, Dictionary
        if (isTslTemplateString(expression)) {
            return expandTracedToNode(expression)`f'${joinTracedToNode(expression, 'expressions')(
                expression.expressions,
                (expr) => this.generateExpression(expr, frame),
                { separator: '' },
            )}'`;
        } else if (isTslLiteral(expression)) {
            if (isTslDictionary(expression)) {
                return expandTracedToNode(expression)`{${joinTracedToNode(expression, 'entries')(
                    expression.entries,
                    (entry) =>
                        expandTracedToNode(entry)`${traceToNode(
                            entry,
                            'key',
                        )(this.generateExpression(entry.key, frame))}: ${traceToNode(
                            entry,
                            'value',
                        )(this.generateExpression(entry.value, frame))}`,
                    { separator: ', ' },
                )}}`;
            } else if (isTslList(expression)) {
                return expandTracedToNode(expression)`np.array([${joinTracedToNode(expression, 'elements')(
                    expression.elements,
                    (value) => this.generateExpression(value, frame),
                    { separator: ', ' },
                )}])`;
            } else if (isTslInt(expression) || isTslFloat(expression)) {
                return expandTracedToNode(expression)`${expression.value}`;
            } else if (isTslBoolean(expression)) {
                if (expression.value.valueOf().toString() === 'true') {
                    return expandTracedToNode(expression)`True`;
                } else {
                    return expandTracedToNode(expression)`False`;
                }
            } else if (isTslString(expression)) {
                return expandTracedToNode(expression)`"${expression.value}"`;
            } else if (isTslNull(expression)) {
                return expandTracedToNode(expression)`None`;
            }
        } else if (isTslCall(expression)) {
            const callable = this.nodeMapper.callToCallable(expression);
            const sortedArgs = this.sortArguments(getArguments(expression));
            const receiver = this.generateExpression(expression.receiver, frame);
            let call: CompositeGeneratorNode | undefined = undefined;

            // Memoize constructor or function call
            if (isTslFunction(callable)) {
                const pythonCall = this.builtinFunction.getPythonCall(callable);
                if (pythonCall) {
                    let thisParam: CompositeGeneratorNode | undefined = undefined;
                    const argumentsMap = this.getArgumentsMap(getArguments(expression), frame);
                    call = this.generatePythonCall(expression, pythonCall, argumentsMap, frame, thisParam);
                }
            }

            if (!call) {
                call = this.generatePlainCall(expression, sortedArgs, frame);
            }

            if (expression.isNullSafe) {
                frame.addUtility(UTILITY_NULL_SAFE_CALL);
                return expandTracedToNode(expression)`${traceToNode(
                    expression,
                    'isNullSafe',
                )(UTILITY_NULL_SAFE_CALL.name)}(${receiver}, lambda: ${call})`;
            } else {
                return call;
            }
        } else if (isTslPredefinedFunction(expression)) {
            if (expression.name === 'len') {
                if (isTslReference(expression.object)) {
                    frame.addUtility(UTILITY_LEN_FUNCTION);
                    return expandTracedToNode(expression)`${traceToNode(
                        expression,
                        'object',
                    )(UTILITY_LEN_FUNCTION.name)}(${expression.object.target.ref?.name})`;
                }
            } else if (expression.name === 'keys') {
                if (isTslReference(expression.object)) {
                    frame.addUtility(UTILITY_KEYS_FUNCTION);
                    return expandTracedToNode(expression)`${traceToNode(
                        expression,
                        'object',
                    )(UTILITY_KEYS_FUNCTION.name)}(${expression.object.target.ref?.name})`;
                }
            } else if (expression.name === 'values') {
                if (isTslReference(expression.object)) {
                    frame.addUtility(UTILITY_VALUES_FUNCTION);
                    return expandTracedToNode(expression)`${traceToNode(
                        expression,
                        'object',
                    )(UTILITY_VALUES_FUNCTION.name)}(${expression.object.target.ref?.name})`;
                }
            }
        } else if (isTslInfixOperation(expression)) {
            const leftOperand = this.generateExpression(expression.leftOperand, frame);
            const rightOperand = this.generateExpression(expression.rightOperand, frame);
            switch (expression.operator) {
                case 'or':
                    frame.addUtility(UTILITY_EAGER_OR);
                    return expandTracedToNode(expression)`${traceToNode(
                        expression,
                        'operator',
                    )(UTILITY_EAGER_OR.name)}(${leftOperand}, ${rightOperand})`;
                case 'and':
                    frame.addUtility(UTILITY_EAGER_AND);
                    return expandTracedToNode(expression)`${traceToNode(
                        expression,
                        'operator',
                    )(UTILITY_EAGER_AND.name)}(${leftOperand}, ${rightOperand})`;
                case '?:':
                    frame.addUtility(UTILITY_EAGER_ELVIS);
                    return expandTracedToNode(expression)`${traceToNode(
                        expression,
                        'operator',
                    )(UTILITY_EAGER_ELVIS.name)}(${leftOperand}, ${rightOperand})`;
                case '===':
                    return expandTracedToNode(expression)`(${leftOperand}) ${traceToNode(
                        expression,
                        'operator',
                    )('is')} (${rightOperand})`;
                case '!==':
                    return expandTracedToNode(expression)`(${leftOperand}) ${traceToNode(
                        expression,
                        'operator',
                    )('is not')} (${rightOperand})`;
                default:
                    return expandTracedToNode(expression)`(${leftOperand}) ${traceToNode(
                        expression,
                        'operator',
                    )(expression.operator)} (${rightOperand})`;
            }
        } else if (isTslIndexedAccess(expression)) {
            if (expression.isNullSafe) {
                frame.addUtility(UTILITY_NULL_SAFE_INDEXED_ACCESS);
                return expandTracedToNode(expression)`${traceToNode(
                    expression,
                    'isNullSafe',
                )(UTILITY_NULL_SAFE_INDEXED_ACCESS.name)}(${this.generateExpression(
                    expression.receiver,
                    frame,
                )}, ${this.generateExpression(expression.index, frame)})`;
            } else {
                return expandTracedToNode(expression)`${this.generateExpression(
                    expression.receiver,
                    frame,
                )}[${this.generateExpression(expression.index, frame)}]`;
            }
        } else if (isTslParenthesizedExpression(expression)) {
            return expandTracedToNode(expression)`${this.generateExpression(expression.expression, frame)}`;
        } else if (isTslPrefixOperation(expression)) {
            const operand = this.generateExpression(expression.operand, frame);
            switch (expression.operator) {
                case 'not':
                    return expandTracedToNode(expression)`${traceToNode(expression, 'operator')('not')} (${operand})`;
                case '-':
                    return expandTracedToNode(expression)`${traceToNode(expression, 'operator')('-')}(${operand})`;
            }
        } else if (isTslReference(expression)) {
            const declaration = expression.target.ref!;
            if (isTslTypeAlias(declaration)) {
                return this.generateType(declaration.type, frame);
            }
            const referenceImport =
                this.getExternalReferenceNeededImport(expression, declaration) ||
                this.getInternalReferenceNeededImport(expression, declaration);
            frame.addImport(referenceImport);
            return traceToNode(expression)(referenceImport?.alias || this.getPythonNameOrDefault(declaration));
        } else if (isTslAggregation(expression)) {
            frame.addUtility(UTILITY_AGGREGATION);
            return expandTracedToNode(expression)`${traceToNode(expression)(
                UTILITY_AGGREGATION.name,
            )}(${'dataframe'}, ${expression.data.target.ref?.name}, ${expression.groupedBy.id.map((id) => id.target.ref?.name).toString()}, '${expression.function}')`;
        }
        /* c8 ignore next 2 */
        throw new Error(`Unknown expression type: ${expression.$type}`);
    }

    private generatePlainCall(
        expression: TslCall,
        sortedArgs: TslArgument[],
        frame: GenerationInfoFrame,
    ): CompositeGeneratorNode {
        let timeunit;
        if (isTslReference(expression.receiver) && expression.receiver.timeunit) {
            timeunit = expression.receiver.timeunit;
        }
        return expandTracedToNode(expression)`${this.generateExpression(expression.receiver, frame)}(`
            .append(
                expandToNode`${joinTracedToNode(expression.argumentList, 'arguments')(
                    sortedArgs,
                    (arg) => this.generateArgument(arg, frame),
                    { separator: ', ' },
                )}`,
            )
            .appendIf(timeunit !== undefined, `, timeunit = "${timeunit?.timeunit}"`)
            .append(')');
    }

    private generateFunctionParameter(funct: TslFunction): CompositeGeneratorNode | undefined {
        let result = '';

        if (funct.parameterList?.parameters.length !== 0) {
            result = ', ';
        }

        if (funct.timeunit !== undefined) {
            return expandToNode`${result}timeunit = None`;
        }
        return undefined;
    }

    private generatePythonCall(
        expression: TslCall,
        pythonCall: string,
        argumentsMap: Map<string, CompositeGeneratorNode>,
        frame: GenerationInfoFrame,
        thisParam: CompositeGeneratorNode | undefined = undefined,
    ): CompositeGeneratorNode {
        if (thisParam) {
            argumentsMap.set('this', thisParam);
        }
        const splitRegex = /(\$[_a-zA-Z][_a-zA-Z0-9]*)/gu;
        const splitPythonCallDefinition = pythonCall.split(splitRegex);
        const generatedPythonCall = joinTracedToNode(expression)(
            splitPythonCallDefinition,
            (part) => {
                if (splitRegex.test(part)) {
                    return argumentsMap.get(part.substring(1))!;
                } else {
                    return part;
                }
            },
            { separator: '' },
        )!;
        // Non-memoizable calls can be directly generated
        if (frame.disableRunnerIntegration) {
            return generatedPythonCall;
        }
        frame.addImport({ importPath: RUNNER_PACKAGE });
        const callable = this.nodeMapper.callToCallable(expression);
        const memoizedArgs = getParameters(callable).map(
            (parameter) => this.nodeMapper.callToParameterValue(expression, parameter)!,
        );
        return expandTracedToNode(
            expression,
        )`${RUNNER_PACKAGE}.memoized_call("${this.generateFullyQualifiedFunctionName(
            expression,
        )}", lambda *_ : ${generatedPythonCall}, [${joinTracedToNode(expression.argumentList, 'arguments')(
            memoizedArgs,
            (arg) => this.generateExpression(arg, frame),
            { separator: ', ' },
        )}])`;
    }

    private generateFullyQualifiedFunctionName(expression: TslCall): string {
        const callable = this.nodeMapper.callToCallable(expression);
        if (isTslDeclaration(callable)) {
            const fullyQualifiedReferenceName = this.getQualifiedNamePythonCompatible(callable);
            if (fullyQualifiedReferenceName) {
                return fullyQualifiedReferenceName;
            }
        }
        /* c8 ignore next */
        throw new Error('Callable of provided call does not exist or is not a declaration.');
    }

    private getArgumentsMap(
        argumentList: TslArgument[],
        frame: GenerationInfoFrame,
    ): Map<string, CompositeGeneratorNode> {
        const argumentsMap = new Map<string, CompositeGeneratorNode>();
        argumentList.reduce((map, value) => {
            map.set(this.nodeMapper.argumentToParameter(value)?.name!, this.generateArgument(value, frame));
            return map;
        }, argumentsMap);
        return argumentsMap;
    }

    private sortArguments(argumentList: TslArgument[]): TslArgument[] {
        // $containerIndex contains the index of the parameter in the receivers parameter list
        const parameters = argumentList.map((argument) => {
            return { par: this.nodeMapper.argumentToParameter(argument), arg: argument };
        });
        return parameters
            .slice()
            .filter((value) => value.par !== undefined)
            .sort((a, b) =>
                a.par !== undefined && b.par !== undefined ? a.par.$containerIndex! - b.par.$containerIndex! : 0,
            )
            .map((value) => value.arg);
    }

    private generateArgument(
        argument: TslArgument,
        frame: GenerationInfoFrame,
        generateOptionalParameterName: boolean = true,
    ): CompositeGeneratorNode {
        const parameter = this.nodeMapper.argumentToParameter(argument);
        return expandTracedToNode(argument)`${
            parameter !== undefined && !Parameter.isRequired(parameter) && generateOptionalParameterName
                ? expandToNode`${this.generateParameter(parameter)}=`
                : ''
        }${this.generateExpression(argument.value, frame)}`;
    }

    private getExternalReferenceNeededImport(
        expression: TslExpression | undefined,
        declaration: TslDeclaration | undefined,
    ): ImportData | undefined {
        if (!expression || !declaration) {
            /* c8 ignore next 2 */
            return undefined;
        }

        // Root Node is always a module.
        const currentModule = <TslModule>AstUtils.findRootNode(expression);
        const targetModule = <TslModule>AstUtils.findRootNode(declaration);
        for (const value of getImports(currentModule)) {
            // Verify same package
            if (value.package !== targetModule.name) {
                continue;
            }
            if (isTslQualifiedImport(value)) {
                const importedDeclarations = getImportedDeclarations(value);
                for (const importedDeclaration of importedDeclarations) {
                    if (declaration === importedDeclaration.declaration?.ref) {
                        if (importedDeclaration.alias !== undefined) {
                            return {
                                importPath: this.getPythonModuleOrDefault(targetModule),
                                declarationName: importedDeclaration.declaration?.ref?.name,
                                alias: importedDeclaration.alias.alias,
                            };
                        } else {
                            return {
                                importPath: this.getPythonModuleOrDefault(targetModule),
                                declarationName: importedDeclaration.declaration?.ref?.name,
                            };
                        }
                    }
                }
            }
            if (isTslWildcardImport(value)) {
                return {
                    importPath: this.getPythonModuleOrDefault(targetModule),
                    declarationName: declaration.name,
                };
            }
        }
        return undefined;
    }

    private getInternalReferenceNeededImport(
        expression: TslExpression,
        declaration: TslDeclaration,
    ): ImportData | undefined {
        // Root Node is always a module.
        const currentModule = <TslModule>AstUtils.findRootNode(expression);
        const targetModule = <TslModule>AstUtils.findRootNode(declaration);
        if (currentModule !== targetModule && !isInFile(targetModule)) {
            return {
                importPath: `${this.getPythonModuleOrDefault(targetModule)}.${this.formatGeneratedFileName(
                    this.getModuleFileBaseName(targetModule),
                )}`,
                declarationName: this.getPythonNameOrDefault(declaration),
            };
        }
        return undefined;
    }

    private getModuleFileBaseName(module: TslModule): string {
        const filePath = AstUtils.getDocument(module).uri.fsPath;
        return path.basename(filePath, path.extname(filePath));
    }

    private formatStringSingleLine(value: string): string {
        return value.replaceAll('\r\n', '\\n').replaceAll('\n', '\\n');
    }
}

interface UtilityFunction {
    readonly name: string;
    readonly code: CompositeGeneratorNode;
    readonly imports?: ImportData[];
    readonly typeVariables?: string[];
}

interface ImportData {
    readonly importPath: string;
    readonly declarationName?: string;
    readonly alias?: string;
}

class GenerationInfoFrame {
    private readonly importSet: Map<String, ImportData>;
    private readonly utilitySet: Set<UtilityFunction>;
    private readonly typeVariableSet: Set<string>;
    public readonly isInsideFunction: boolean;
    public readonly targetPlaceholder: string[] | undefined;
    public readonly disableRunnerIntegration: boolean;

    constructor(
        importSet: Map<String, ImportData> = new Map<String, ImportData>(),
        utilitySet: Set<UtilityFunction> = new Set<UtilityFunction>(),
        typeVariableSet: Set<string> = new Set<string>(),
        insideFunction: boolean = false,
        targetPlaceholder: string[] | undefined = undefined,
        disableRunnerIntegration: boolean = false,
    ) {
        this.importSet = importSet;
        this.utilitySet = utilitySet;
        this.typeVariableSet = typeVariableSet;
        this.isInsideFunction = insideFunction;
        this.targetPlaceholder = targetPlaceholder;
        this.disableRunnerIntegration = disableRunnerIntegration;
    }

    addImport(importData: ImportData | undefined) {
        if (importData) {
            const hashKey = JSON.stringify(importData);
            if (!this.importSet.has(hashKey)) {
                this.importSet.set(hashKey, importData);
            }
        }
    }

    addUtility(utilityFunction: UtilityFunction) {
        const imports = utilityFunction.imports || [];
        const typeVariables = utilityFunction.typeVariables || [];

        this.utilitySet.add(utilityFunction);
        for (const importData of imports) {
            this.addImport(importData);
        }

        if (!isEmpty(typeVariables)) {
            this.addImport({ importPath: 'typing', declarationName: 'TypeVar' });
        }

        for (const typeVariable of typeVariables) {
            this.typeVariableSet.add(typeVariable);
        }
    }
}

export interface GenerateOptions {
    destination: URI;
    createSourceMaps: boolean;
    targetPlaceholder: string[] | undefined;
    disableRunnerIntegration: boolean;
}
