import { AstNode, CstNode, CstUtils, isAstNode } from 'langium';
import { last } from '../../helpers/collections.js';
import * as ast from '../generated/ast.js';
import { getAnnotationCalls, getLiterals, getTypeArguments } from '../helpers/nodeProperties.js';
import { AbstractFormatter, Formatting, FormattingAction, FormattingActionOptions } from 'langium/lsp';
import indent = Formatting.indent;
import newLine = Formatting.newLine;
import newLines = Formatting.newLines;
import noSpace = Formatting.noSpace;
import oneSpace = Formatting.oneSpace;

const newLinesWithIndent = function (count: number, options?: FormattingActionOptions): FormattingAction {
    return {
        options: options ?? {},
        moves: [
            {
                tabs: 1,
                lines: count,
            },
        ],
    };
};

export class SafeDsFormatter extends AbstractFormatter {
    protected override format(node: AstNode): void {
        // -----------------------------------------------------------------------------
        // Module
        // -----------------------------------------------------------------------------
        if (ast.isTslModule(node)) {
            this.formatTslModule(node);
        } else if (ast.isTslImport(node)) {
            this.formatTslImport(node);
        } else if (ast.isTslImportedDeclarationList(node)) {
            this.formatTslImportedDeclarationList(node);
        } else if (ast.isTslImportedDeclaration(node)) {
            this.formatTslImportedDeclaration(node);
        } else if (ast.isTslImportedDeclarationAlias(node)) {
            this.formatTslImportedDeclarationAlias(node);
        }

        // -----------------------------------------------------------------------------
        // Declarations
        // -----------------------------------------------------------------------------
        else if (ast.isTslAnnotation(node)) {
            this.formatTslAnnotation(node);
        } else if (ast.isTslAttribute(node)) {
            this.formatTslAttribute(node);
        } else if (ast.isTslClass(node)) {
            this.formatTslClass(node);
        } else if (ast.isTslParentTypeList(node)) {
            this.formatTslParentTypeList(node);
        } else if (ast.isTslClassBody(node)) {
            this.formatTslClassBody(node);
        } else if (ast.isTslEnum(node)) {
            this.formatTslEnum(node);
        } else if (ast.isTslEnumBody(node)) {
            this.formatTslEnumBody(node);
        } else if (ast.isTslEnumVariant(node)) {
            this.formatTslEnumVariant(node);
        } else if (ast.isTslFunction(node)) {
            this.formatTslFunction(node);
        } else if (ast.isTslPipeline(node)) {
            this.formatTslPipeline(node);
        } else if (ast.isTslSegment(node)) {
            this.formatTslSegment(node);
        }

        // -----------------------------------------------------------------------------
        // Annotation calls
        // -----------------------------------------------------------------------------
        else if (ast.isTslAnnotationCallList(node)) {
            this.formatTslAnnotationCallList(node);
        } else if (ast.isTslAnnotationCall(node)) {
            this.formatTslAnnotationCall(node);
        }

        // -----------------------------------------------------------------------------
        // Constraints
        // -----------------------------------------------------------------------------
        else if (ast.isTslConstraintList(node)) {
            this.formatTslConstraintList(node);
        } else if (ast.isTslParameterBound(node)) {
            this.formatTslParameterBound(node);
        }

        // -----------------------------------------------------------------------------
        // Callables, parameters, and results
        // -----------------------------------------------------------------------------
        else if (ast.isTslParameterList(node)) {
            this.formatTslParameterList(node);
        } else if (ast.isTslParameter(node)) {
            this.formatTslParameter(node);
        } else if (ast.isTslResultList(node)) {
            this.formatTslResultList(node);
        } else if (ast.isTslResult(node)) {
            this.formatTslResult(node);
        }

        // -----------------------------------------------------------------------------
        // Statements
        // -----------------------------------------------------------------------------
        else if (ast.isTslBlock(node)) {
            this.formatTslBlock(node);
        } else if (ast.isTslAssignment(node)) {
            this.formatTslAssignment(node);
        } else if (ast.isTslAssigneeList(node)) {
            this.formatTslAssigneeList(node);
        } else if (ast.isTslPlaceholder(node)) {
            this.formatTslPlaceholder(node);
        } else if (ast.isTslYield(node)) {
            this.formatTslYield(node);
        } else if (ast.isTslExpressionStatement(node)) {
            this.formatTslExpressionStatement(node);
        }

        // -----------------------------------------------------------------------------
        // Expressions
        // -----------------------------------------------------------------------------
        else if (ast.isTslBlockLambda(node)) {
            this.formatTslBlockLambda(node);
        } else if (ast.isTslBlockLambdaResult(node)) {
            this.formatTslBlockLambdaResult(node);
        } else if (ast.isTslExpressionLambda(node)) {
            this.formatTslExpressionLambda(node);
        } else if (ast.isTslInfixOperation(node)) {
            this.formatTslInfixOperation(node);
        } else if (ast.isTslPrefixOperation(node)) {
            this.formatTslPrefixOperation(node);
        } else if (ast.isTslCall(node)) {
            this.formatTslCall(node);
        } else if (ast.isTslArgumentList(node)) {
            this.formatTslArgumentList(node);
        } else if (ast.isTslArgument(node)) {
            this.formatTslArgument(node);
        } else if (ast.isTslIndexedAccess(node)) {
            this.formatTslIndexedAccess(node);
        } else if (ast.isTslMemberAccess(node)) {
            this.formatTslMemberAccess(node);
        } else if (ast.isTslList(node)) {
            this.formatTslList(node);
        } else if (ast.isTslDictionary(node)) {
            this.formatTslDictionary(node);
        } else if (ast.isTslDictionaryEntry(node)) {
            this.formatTslDictionaryEntry(node);
        } else if (ast.isTslParenthesizedExpression(node)) {
            this.formatTslParenthesizedExpression(node);
        } else if (ast.isTslTemplateStringStart(node)) {
            this.formatTslTemplateStringStart(node);
        } else if (ast.isTslTemplateStringInner(node)) {
            this.formatTslTemplateStringInner(node);
        } else if (ast.isTslTemplateStringEnd(node)) {
            this.formatTslTemplateStringEnd(node);
        } else if (ast.isTslTypeCast(node)) {
            this.formatTslTypeCast(node);
        }

        // -----------------------------------------------------------------------------
        // Types
        // -----------------------------------------------------------------------------
        else if (ast.isTslMemberType(node)) {
            this.formatTslMemberType(node);
        } else if (ast.isTslCallableType(node)) {
            this.formatTslCallableType(node);
        } else if (ast.isTslLiteralType(node)) {
            this.formatTslLiteralType(node);
        } else if (ast.isTslLiteralList(node)) {
            this.formatTslLiteralList(node);
        } else if (ast.isTslNamedType(node)) {
            this.formatTslNamedType(node);
        } else if (ast.isTslUnionType(node)) {
            this.formatTslUnionType(node);
        } else if (ast.isTslTypeParameterList(node)) {
            this.formatTslTypeParameterList(node);
        } else if (ast.isTslTypeParameter(node)) {
            this.formatTslTypeParameter(node);
        } else if (ast.isTslTypeArgumentList(node)) {
            this.formatTslTypeArgumentList(node);
        } else if (ast.isTslTypeArgument(node)) {
            this.formatTslTypeArgument(node);
        }

        // -----------------------------------------------------------------------------
        // Schemas
        // -----------------------------------------------------------------------------
        else if (ast.isTslSchema(node)) {
            this.formatTslSchema(node);
        } else if (ast.isTslColumnList(node)) {
            this.formatTslColumnList(node);
        } else if (ast.isTslColumn(node)) {
            this.formatTslColumn(node);
        }
    }

    // -----------------------------------------------------------------------------
    // Module
    // -----------------------------------------------------------------------------

    private formatTslModule(node: ast.TslModule): void {
        const formatter = this.getNodeFormatter(node);
        const annotations = getAnnotationCalls(node);
        const name = node.name;
        const imports = node.imports;
        const members = node.members;

        // Annotations
        annotations.forEach((value, index) => {
            if (index === 0) {
                if (this.hasComment(value)) {
                    formatter.node(value).prepend(newLine());
                } else {
                    formatter.node(value).prepend(noSpace());
                }
            } else {
                formatter.node(value).prepend(newLines(1));
            }
        });

        // Package
        if (annotations.length === 0) {
            const packageKeyword = formatter.keyword('package');
            const cstNodes = packageKeyword.nodes;

            if (cstNodes.length > 0 && this.hasComment(cstNodes[0])) {
                packageKeyword.prepend(newLine());
            } else {
                packageKeyword.prepend(noSpace());
            }
        } else {
            formatter.keyword('package').prepend(newLines(2));
        }
        formatter.keyword('package').append(oneSpace());
        formatter.keyword('.').surround(noSpace());

        // Imports
        imports.forEach((value, index) => {
            if (index === 0) {
                if (annotations.length === 0 && !name) {
                    if (this.hasComment(value)) {
                        formatter.node(value).prepend(newLine());
                    } else {
                        formatter.node(value).prepend(noSpace());
                    }
                } else {
                    formatter.node(value).prepend(newLines(2));
                }
            } else {
                formatter.node(value).prepend(newLines(1));
            }
        });

        // Members
        members.forEach((value, index) => {
            if (index === 0) {
                if (annotations.length === 0 && !name && imports.length === 0) {
                    if (this.hasComment(value)) {
                        formatter.node(value).prepend(newLine());
                    } else {
                        formatter.node(value).prepend(noSpace());
                    }
                } else {
                    const valueAnnotations = getAnnotationCalls(value);
                    if (valueAnnotations.length > 0) {
                        formatter.node(valueAnnotations[0]!).prepend(newLines(2));
                    } else {
                        formatter.node(value).prepend(newLines(2));
                    }
                }
            } else {
                const valueAnnotations = getAnnotationCalls(value);
                if (valueAnnotations.length > 0) {
                    formatter.node(valueAnnotations[0]!).prepend(newLines(2));
                } else {
                    formatter.node(value).prepend(newLines(2));
                }
            }
        });
    }

    private formatTslImport(node: ast.TslImport): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('from').append(oneSpace());
        formatter.keyword('.').surround(noSpace());
        formatter.keyword('import').surround(oneSpace());
    }

    private formatTslImportedDeclarationList(node: ast.TslImportedDeclarationList): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keywords(',').prepend(noSpace()).append(oneSpace());
    }

    private formatTslImportedDeclaration(node: ast.TslImportedDeclaration): void {
        const formatter = this.getNodeFormatter(node);

        formatter.property('alias').prepend(oneSpace());
    }

    private formatTslImportedDeclarationAlias(node: ast.TslImportedDeclarationAlias): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('as').append(oneSpace());
    }

    // -----------------------------------------------------------------------------
    // Declarations
    // -----------------------------------------------------------------------------

    private formatTslAnnotation(node: ast.TslAnnotation): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            formatter.keyword('annotation').prepend(newLine());
        }

        formatter.property('name').prepend(oneSpace());
        formatter.property('parameterList').prepend(noSpace());
        formatter.property('constraintList').prepend(oneSpace());
    }

    private formatTslAttribute(node: ast.TslAttribute): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            if (node.isStatic) {
                formatter.keyword('static').prepend(newLine());
            } else {
                formatter.keyword('attr').prepend(newLine());
            }
        }

        formatter.keyword('static').append(oneSpace());
        formatter.property('name').prepend(oneSpace());
        formatter.keyword(':').prepend(noSpace()).append(oneSpace());
    }

    private formatTslClass(node: ast.TslClass): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            formatter.keyword('class').prepend(newLine());
        }

        formatter.property('name').prepend(oneSpace());
        formatter.property('typeParameterList').prepend(noSpace());
        formatter.property('parameterList').prepend(noSpace());
        formatter.property('parentTypeList').prepend(oneSpace());
        formatter.property('constraintList').prepend(oneSpace());

        if (node.constraintList) {
            formatter.property('body').prepend(newLine());
        } else {
            formatter.property('body').prepend(oneSpace());
        }
    }

    formatTslParentTypeList(node: ast.TslParentTypeList): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('sub').append(oneSpace());
        formatter.keywords(',').prepend(noSpace()).append(oneSpace());
    }

    private formatTslClassBody(node: ast.TslClassBody): void {
        const formatter = this.getNodeFormatter(node);

        const members = node.members ?? [];
        if (members.length === 0) {
            formatter.keyword('{').append(noSpace());
            formatter.keyword('}').prepend(noSpace());
        } else {
            members.forEach((value, index) => {
                if (index === 0) {
                    formatter.node(value).prepend(indent());
                } else {
                    formatter.node(value).prepend(newLinesWithIndent(2));
                }
            });
            formatter.keyword('}').prepend(newLine());
        }
    }

    private formatTslEnum(node: ast.TslEnum): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            formatter.keyword('enum').prepend(newLine());
        }

        formatter.property('name').prepend(oneSpace());
        formatter.property('body').prepend(oneSpace());
    }

    private formatTslEnumBody(node: ast.TslEnumBody): void {
        const formatter = this.getNodeFormatter(node);

        const variants = node.variants ?? [];
        if (variants.length === 0) {
            formatter.keyword('{').append(noSpace());
            formatter.keyword('}').prepend(noSpace());
        } else {
            variants.forEach((value, index) => {
                if (index === 0) {
                    formatter.node(value).prepend(indent());
                } else {
                    formatter.node(value).prepend(newLinesWithIndent(2));
                }
            });
            formatter.keyword('}').prepend(newLine());
        }
    }

    private formatTslEnumVariant(node: ast.TslEnumVariant): void {
        const formatter = this.getNodeFormatter(node);

        const annotationCalls = getAnnotationCalls(node);

        formatter.nodes(...annotationCalls.slice(1)).prepend(newLine());

        if (getAnnotationCalls(node).length > 0) {
            formatter.property('name').prepend(newLine());
        }

        formatter.property('parameterList').prepend(noSpace());
        formatter.property('constraintList').prepend(oneSpace());
    }

    formatTslFunction(node: ast.TslFunction): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            if (node.isStatic) {
                formatter.keyword('static').prepend(newLine());
            } else {
                formatter.keyword('fun').prepend(newLine());
            }
        }

        formatter.keyword('static').append(oneSpace());
        formatter.property('name').prepend(oneSpace());
        formatter.property('typeParameterList').prepend(noSpace());
        formatter.property('parameterList').prepend(noSpace());
        formatter.property('resultList').prepend(oneSpace());
        formatter.property('constraintList').prepend(oneSpace());
    }

    private formatTslPipeline(node: ast.TslPipeline): void {
        const formatter = this.getNodeFormatter(node);

        formatter.property('annotationCallList').prepend(noSpace());

        if (getAnnotationCalls(node).length > 0) {
            formatter.keyword('pipeline').prepend(newLine());
        }

        formatter.property('name').prepend(oneSpace());
        formatter.node(node.body).prepend(oneSpace());
    }

    private formatTslSegment(node: ast.TslSegment): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length === 0) {
            if (node.visibility) {
                formatter.keyword('segment').prepend(oneSpace());
            }
        } else {
            if (node.visibility) {
                formatter.property('visibility').prepend(newLine());
                formatter.keyword('segment').prepend(oneSpace());
            } else {
                formatter.keyword('segment').prepend(newLine());
            }
        }

        formatter.property('name').prepend(oneSpace());
        formatter.property('parameterList').prepend(noSpace());
        formatter.property('resultList').prepend(oneSpace());
        formatter.property('constraintList').prepend(oneSpace());
        formatter.property('body').prepend(oneSpace());
    }

    // -----------------------------------------------------------------------------
    // Annotation calls
    // -----------------------------------------------------------------------------

    private formatTslAnnotationCallList(node: ast.TslAnnotationCallList): void {
        const formatter = this.getNodeFormatter(node);
        const annotationCalls = node.annotationCalls ?? [];

        formatter.nodes(...annotationCalls.slice(1)).prepend(newLine());
    }

    private formatTslAnnotationCall(node: ast.TslAnnotationCall): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('@').append(noSpace());
        formatter.property('argumentList').prepend(noSpace());
    }

    // -----------------------------------------------------------------------------
    // Constraints
    // -----------------------------------------------------------------------------

    private formatTslConstraintList(node: ast.TslConstraintList) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('where').append(oneSpace());

        const openingBrace = formatter.keyword('{');
        const closingBrace = formatter.keyword('}');

        const constraints = node.constraints ?? [];

        if (constraints.length === 0) {
            openingBrace.append(noSpace());
            closingBrace.prepend(noSpace());
        } else {
            formatter.nodes(...constraints).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingBrace.prepend(newLine());
        }
    }

    private formatTslParameterBound(node: ast.TslParameterBound) {
        const formatter = this.getNodeFormatter(node);

        formatter.property('operator').surround(oneSpace());
    }

    // -----------------------------------------------------------------------------
    // Callables, parameters, and results
    // -----------------------------------------------------------------------------

    private formatTslParameterList(node: ast.TslParameterList): void {
        const formatter = this.getNodeFormatter(node);

        const openingParenthesis = formatter.keyword('(');
        const closingParenthesis = formatter.keyword(')');

        const parameters = node.parameters ?? [];

        if (
            parameters.length >= 3 ||
            parameters.some((it) => getAnnotationCalls(it).length > 0 || this.isComplexType(it.type))
        ) {
            formatter.nodes(...parameters).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingParenthesis.prepend(newLine());
        } else {
            openingParenthesis.append(noSpace());
            formatter.nodes(...parameters.slice(1)).prepend(oneSpace());
            formatter.keywords(',').prepend(noSpace());
            closingParenthesis.prepend(noSpace());
        }
    }

    private formatTslParameter(node: ast.TslParameter): void {
        const formatter = this.getNodeFormatter(node);

        const lastAnnotationCall = last(getAnnotationCalls(node));
        if (lastAnnotationCall) {
            formatter.node(lastAnnotationCall).append(newLine());
        }

        formatter.keyword('const').append(oneSpace());
        formatter.keyword('vararg').append(oneSpace());
        formatter.keyword(':').prepend(noSpace()).append(oneSpace());
        formatter.keyword('=').surround(oneSpace());
    }

    private formatTslResultList(node: ast.TslResultList): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('->').surround(oneSpace());

        const openingParenthesis = formatter.keyword('(');
        const closingParenthesis = formatter.keyword(')');

        const results = node.results ?? [];

        if (
            results.length >= 3 ||
            results.some((it) => getAnnotationCalls(it).length > 0 || this.isComplexType(it.type))
        ) {
            formatter.nodes(...results).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingParenthesis.prepend(newLine());
        } else {
            openingParenthesis.append(noSpace());
            formatter.nodes(...results.slice(1)).prepend(oneSpace());
            formatter.keywords(',').prepend(noSpace());
            closingParenthesis.prepend(noSpace());
        }
    }

    private formatTslResult(node: ast.TslResult): void {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            formatter.property('name').prepend(newLine());
        }

        formatter.keyword(':').prepend(noSpace()).append(oneSpace());
    }

    // -----------------------------------------------------------------------------
    // Statements
    // -----------------------------------------------------------------------------

    private formatTslBlock(node: ast.TslBlock): void {
        const formatter = this.getNodeFormatter(node);
        const openingBrace = formatter.keyword('{');
        const closingBrace = formatter.keyword('}');

        if (node.statements.length === 0) {
            openingBrace.append(noSpace());
            closingBrace.prepend(noSpace());
        } else {
            formatter.nodes(...node.statements).prepend(indent({ allowMore: true }));
            closingBrace.prepend(newLine());
        }
    }

    private formatTslAssignment(node: ast.TslAssignment) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('=').surround(oneSpace());
        formatter.keyword(';').prepend(noSpace());
    }

    private formatTslAssigneeList(node: ast.TslAssigneeList) {
        const formatter = this.getNodeFormatter(node);

        formatter.keywords(',').prepend(noSpace()).append(oneSpace());
    }

    private formatTslPlaceholder(node: ast.TslPlaceholder) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('val').append(oneSpace());
    }

    private formatTslYield(node: ast.TslYield) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('yield').append(oneSpace());
        formatter.property('result').prepend(oneSpace());
    }

    private formatTslExpressionStatement(node: ast.TslExpressionStatement) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword(';').prepend(noSpace());
    }

    // -----------------------------------------------------------------------------
    // Expressions
    // -----------------------------------------------------------------------------

    private formatTslBlockLambda(node: ast.TslBlockLambda): void {
        const formatter = this.getNodeFormatter(node);

        formatter.property('body').prepend(oneSpace());
    }

    private formatTslBlockLambdaResult(node: ast.TslBlockLambdaResult) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('yield').append(oneSpace());
    }

    private formatTslExpressionLambda(node: ast.TslExpressionLambda) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('->').surround(oneSpace());
    }

    private formatTslInfixOperation(node: ast.TslInfixOperation) {
        const formatter = this.getNodeFormatter(node);

        formatter.property('operator').surround(oneSpace());
    }

    private formatTslPrefixOperation(node: ast.TslPrefixOperation) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('not').append(oneSpace());
        formatter.keyword('-').append(noSpace());
    }

    private formatTslCall(node: ast.TslCall) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('?').surround(noSpace());
        formatter.property('argumentList').prepend(noSpace());
    }

    private formatTslArgumentList(node: ast.TslArgumentList): void {
        const formatter = this.getNodeFormatter(node);

        const openingParenthesis = formatter.keyword('(');
        const closingParenthesis = formatter.keyword(')');

        const args = node.arguments ?? [];

        if (args.length >= 3 || args.some((it) => this.isComplexExpression(it.value))) {
            formatter.nodes(...args).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingParenthesis.prepend(newLine());
        } else {
            openingParenthesis.append(noSpace());
            formatter.nodes(...args.slice(1)).prepend(oneSpace());
            formatter.keywords(',').prepend(noSpace());
            closingParenthesis.prepend(noSpace());
        }
    }

    private formatTslArgument(node: ast.TslArgument): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('=').surround(oneSpace());
    }

    private formatTslIndexedAccess(node: ast.TslIndexedAccess) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('?').surround(noSpace());
        formatter.keyword('[').surround(noSpace());
        formatter.keyword(']').prepend(noSpace());
    }

    private formatTslMemberAccess(node: ast.TslMemberAccess) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('?').surround(noSpace());
        formatter.keyword('.').surround(noSpace());
    }

    private formatTslList(node: ast.TslList) {
        const formatter = this.getNodeFormatter(node);

        const openingSquareBracket = formatter.keyword('[');
        const closingSquareBracket = formatter.keyword(']');

        const elements = node.elements;

        if (elements.some((it) => this.isComplexExpression(it))) {
            formatter.nodes(...elements).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingSquareBracket.prepend(newLine());
        } else {
            openingSquareBracket.append(noSpace());
            formatter.nodes(...elements.slice(1)).prepend(oneSpace());
            formatter.keywords(',').prepend(noSpace());
            closingSquareBracket.prepend(noSpace());
        }
    }

    private formatTslDictionary(node: ast.TslDictionary) {
        const formatter = this.getNodeFormatter(node);

        const openingCurlyBrace = formatter.keyword('{');
        const closingCurlyBrace = formatter.keyword('}');

        const entries = node.entries;

        if (
            entries.length >= 2 ||
            entries.some((it) => this.isComplexExpression(it.key) || this.isComplexExpression(it.value))
        ) {
            formatter.nodes(...entries).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingCurlyBrace.prepend(newLine());
        } else {
            openingCurlyBrace.append(noSpace());
            formatter.nodes(...entries.slice(1)).prepend(oneSpace());
            formatter.keywords(',').prepend(noSpace());
            closingCurlyBrace.prepend(noSpace());
        }
    }

    private formatTslDictionaryEntry(node: ast.TslDictionaryEntry) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword(':').prepend(noSpace()).append(oneSpace());
    }

    private formatTslParenthesizedExpression(node: ast.TslParenthesizedExpression): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('(').append(noSpace());
        formatter.keyword(')').prepend(noSpace());
    }

    private formatTslTemplateStringStart(node: ast.TslTemplateStringStart) {
        const formatter = this.getNodeFormatter(node);

        formatter.node(node).append(oneSpace());
    }

    private formatTslTemplateStringInner(node: ast.TslTemplateStringInner) {
        const formatter = this.getNodeFormatter(node);

        formatter.node(node).surround(oneSpace());
    }

    private formatTslTemplateStringEnd(node: ast.TslTemplateStringEnd) {
        const formatter = this.getNodeFormatter(node);

        formatter.node(node).prepend(oneSpace());
    }

    private formatTslTypeCast(node: ast.TslTypeCast) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('as').surround(oneSpace());
    }

    /**
     * Returns whether the expression is considered complex and requires special formatting like placing the associated
     * expression on its own line.
     *
     * @param node The expression to check.
     */
    private isComplexExpression(node: ast.TslExpression | undefined): boolean {
        return ast.isTslChainedExpression(node) || ast.isTslList(node) || ast.isTslDictionary(node);
    }

    // -----------------------------------------------------------------------------
    // Types
    // -----------------------------------------------------------------------------

    private formatTslMemberType(node: ast.TslMemberType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('.').surround(noSpace());
    }

    private formatTslCallableType(node: ast.TslCallableType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('->').surround(oneSpace());
    }

    private formatTslLiteralType(node: ast.TslLiteralType): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('literal').append(noSpace());
    }

    private formatTslLiteralList(node: ast.TslLiteralList): void {
        const formatter = this.getNodeFormatter(node);
        const literals = node.literals ?? [];

        if (literals.length > 0) {
            formatter.node(literals[0]!).prepend(noSpace());
            formatter.nodes(...literals.slice(1)).prepend(oneSpace());
        }

        formatter.keywords(',').prepend(noSpace());
        formatter.keyword('>').prepend(noSpace());
    }

    private formatTslNamedType(node: ast.TslNamedType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('?').prepend(noSpace());
        formatter.property('typeArgumentList').prepend(noSpace());
    }

    private formatTslUnionType(node: ast.TslUnionType): void {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('union').append(noSpace());
    }

    private formatTslTypeParameterList(node: ast.TslTypeParameterList): void {
        const formatter = this.getNodeFormatter(node);

        const closingBracket = formatter.keyword('>');

        const typeParameters = node.typeParameters ?? [];

        if (typeParameters.length >= 3 || typeParameters.some((it) => getAnnotationCalls(it).length > 0)) {
            formatter.nodes(...typeParameters).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            closingBracket.prepend(newLine());
        } else {
            if (typeParameters.length > 0) {
                formatter.node(typeParameters[0]!).prepend(noSpace());
                formatter.nodes(...typeParameters.slice(1)).prepend(oneSpace());
            }
            formatter.keywords(',').prepend(noSpace());
            closingBracket.prepend(noSpace());
        }
    }

    private formatTslTypeParameter(node: ast.TslTypeParameter) {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            if (node.variance) {
                formatter.property('variance').prepend(newLine());
            } else {
                formatter.property('name').prepend(newLine());
            }
        }

        formatter.property('variance').append(oneSpace());
        formatter.keyword('sub').surround(oneSpace());
        formatter.keyword('=').surround(oneSpace());
    }

    private formatTslTypeArgumentList(node: ast.TslTypeArgumentList): void {
        const formatter = this.getNodeFormatter(node);
        const typeArguments = node.typeArguments ?? [];

        if (typeArguments.length > 0) {
            formatter.node(typeArguments[0]!).prepend(noSpace());
            formatter.nodes(...typeArguments.slice(1)).prepend(oneSpace());
        }

        formatter.keywords(',').prepend(noSpace());
        formatter.keyword('>').prepend(noSpace());
    }

    private formatTslTypeArgument(node: ast.TslTypeArgument) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('=').surround(oneSpace());
    }

    /**
     * Returns whether the type is considered complex and requires special formatting like placing the associated
     * parameter on its own line.
     *
     * @param node The type to check.
     */
    private isComplexType(node: ast.TslType | undefined): boolean {
        if (!node) {
            return false;
        }

        if (ast.isTslCallableType(node) || ast.isTslMemberType(node)) {
            return true;
        } else if (ast.isTslLiteralType(node)) {
            return getLiterals(node).length > 0;
        } else if (ast.isTslNamedType(node)) {
            return getTypeArguments(node.typeArgumentList).length > 0;
        } else if (ast.isTslUnionType(node)) {
            return getTypeArguments(node.typeArgumentList).length > 0;
        } else {
            /* c8 ignore next 2 */
            return false;
        }
    }

    // -----------------------------------------------------------------------------
    // Schemas
    // -----------------------------------------------------------------------------

    private formatTslSchema(node: ast.TslSchema) {
        const formatter = this.getNodeFormatter(node);

        if (getAnnotationCalls(node).length > 0) {
            formatter.keyword('schema').prepend(newLine());
        }

        formatter.property('name').prepend(oneSpace());
        formatter.property('columnList').prepend(oneSpace());
    }

    private formatTslColumnList(node: ast.TslColumnList) {
        const formatter = this.getNodeFormatter(node);
        const columns = node.columns ?? [];

        if (columns.length === 0) {
            formatter.keyword('{').append(noSpace());
            formatter.keyword('}').prepend(noSpace());
        } else {
            formatter.nodes(...columns).prepend(indent());
            formatter.keywords(',').prepend(noSpace());
            formatter.keyword('}').prepend(newLine());
        }
    }

    private formatTslColumn(node: ast.TslColumn) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword(':').prepend(noSpace()).append(oneSpace());
    }

    // -----------------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------------

    /**
     * Returns whether the given node has a comment associated with it.
     *
     * @param node The node to check.
     */
    private hasComment(node: AstNode | CstNode | undefined): boolean {
        return Boolean(this.getCommentNode(node));
    }

    /**
     * Returns the comment associated with the given node.
     *
     * @param node The node to get the comment for.
     */
    private getCommentNode(node: AstNode | CstNode | undefined): CstNode | undefined {
        const commentNames = ['ML_COMMENT', 'SL_COMMENT'];

        if (isAstNode(node)) {
            return CstUtils.findCommentNode(node.$cstNode, commentNames);
        } else {
            return CstUtils.findCommentNode(node, commentNames);
        }
    }
}
