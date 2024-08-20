import { AstNode, CstNode, CstUtils, isAstNode } from 'langium';
import * as ast from '../generated/ast.js';
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

export class TTSLFormatter extends AbstractFormatter {
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
        else if (ast.isTslFunction(node)) {
            this.formatTslFunction(node);
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
        } else if (ast.isTslExpressionStatement(node)) {
            this.formatTslExpressionStatement(node);
        }

        // -----------------------------------------------------------------------------
        // Expressions
        // -----------------------------------------------------------------------------
        else if (ast.isTslInfixOperation(node)) {
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
        } else if (ast.isTslList(node)) {
            this.formatTslList(node);
        } else if (ast.isTslDictionary(node)) {
            this.formatTslDictionary(node);
        } else if (ast.isTslDictionaryEntry(node)) {
            this.formatTslDictionaryEntry(node);
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
        else if (ast.isTslIntType(node)) {
            this.formatTslIntType(node);
        } else if (ast.isTslFloatType(node)) {
            this.formatTslFloatType(node);
        } else if (ast.isTslStringType(node)) {
            this.formatTslStringType(node);
        } else if (ast.isTslBooleanType(node)) {
            this.formatTslBooleanType(node);
        } else if (ast.isTslListType(node)) {
            this.formatTslListType(node);
        } else if (ast.isTslDictionaryType(node)) {
            this.formatTslDictionaryType(node);
        } 
    }

    // -----------------------------------------------------------------------------
    // Module
    // -----------------------------------------------------------------------------

    private formatTslModule(node: ast.TslModule): void {
        const formatter = this.getNodeFormatter(node);
        const name = node.name;
        const imports = node.imports;
        const members = node.members;

        // Package
        const packageKeyword = formatter.keyword('package');
        const cstNodes = packageKeyword.nodes;

        if (cstNodes.length > 0 && this.hasComment(cstNodes[0])) {
            packageKeyword.prepend(newLine());
        } else {
            packageKeyword.prepend(noSpace());
        }
        formatter.keyword('package').append(oneSpace());
        formatter.keyword('.').surround(noSpace());

        // Imports
        imports.forEach((value, index) => {
            if (index === 0) {
                if (!name) {
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
                if (!name && imports.length === 0) {
                    if (this.hasComment(value)) {
                        formatter.node(value).prepend(newLine());
                    } else {
                        formatter.node(value).prepend(noSpace());
                    }
                } else {
                    formatter.node(value).prepend(newLines(2));
                }
            } else {
                formatter.node(value).prepend(newLines(2));
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

    formatTslFunction(node: ast.TslFunction): void {
        const formatter = this.getNodeFormatter(node);

        formatter.property('name').prepend(oneSpace());
        formatter.property('visibility').prepend(noSpace());
        formatter.property('parameterList').prepend(noSpace());
        formatter.property('result').prepend(oneSpace());
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
            parameters.length >= 3
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
            results.length >= 3
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

    private formatTslExpressionStatement(node: ast.TslExpressionStatement) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword(';').prepend(noSpace());
    }

    // -----------------------------------------------------------------------------
    // Expressions
    // -----------------------------------------------------------------------------

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

    private formatTslIntType(node: ast.TslIntType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('Int').surround(oneSpace());
    }

    private formatTslFloatType(node: ast.TslFloatType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('Float').surround(oneSpace());
    }

    private formatTslStringType(node: ast.TslStringType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('String').surround(oneSpace());
    }

    private formatTslBooleanType(node: ast.TslBooleanType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('Boolean').surround(oneSpace());
    }

    private formatTslListType(node: ast.TslListType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('List<').prepend(oneSpace());
    }

    private formatTslDictionaryType(node: ast.TslDictionaryType) {
        const formatter = this.getNodeFormatter(node);

        formatter.keyword('Dictionary<').prepend(oneSpace());
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
