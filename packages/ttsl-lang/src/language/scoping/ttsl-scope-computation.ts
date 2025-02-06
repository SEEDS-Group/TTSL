import {
    AstNode,
    AstNodeDescription,
    AstUtils,
    DefaultScopeComputation,
    LangiumDocument,
    PrecomputedScopes,
} from 'langium';
import {
    isTslAssignment,
    isTslConditionalStatement,
    isTslDeclaration,
    isTslForeachLoop,
    isTslForLoop,
    isTslFunction,
    isTslLoop,
    isTslModule,
    isTslPlaceholder,
    isTslTimespanStatement,
    TslConditionalStatement,
    TslFunction,
    TslLoop,
    TslTimespanStatement,
} from '../generated/ast.js';

export class TTSLScopeComputation extends DefaultScopeComputation {
    protected override exportNode(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument): void {
        // Modules, pipelines, and private segments cannot be referenced from other documents
        if (isTslModule(node)) {
            return;
        }

        // Modules that don't state their package don't export anything
        const containingModule = AstUtils.getContainerOfType(node, isTslModule);
        if (!containingModule || !containingModule.name) {
            return;
        }

        super.exportNode(node, exports, document);
    }

    protected override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
        if (isTslFunction(node)) {
            this.processTslFunction(node, document, scopes);
        } else if (isTslLoop(node)) {
            this.processTslLoop(node, document, scopes);
        } else if (isTslConditionalStatement(node)) {
            this.processTslConditionalStatement(node, document, scopes);
        } else if (isTslTimespanStatement(node)) {
            this.processTslTimespanStatement(node, document, scopes);
        } else {
            super.processNode(node, document, scopes);
        }
    }

    private processTslFunction(node: TslFunction, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        this.addToScopesIfKeyIsDefined(scopes, node.parameterList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.body, description);
        this.addToScopesIfKeyIsDefined(scopes, node.result, description);

        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
    }

    private processTslLoop(node: TslLoop, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        if (
            isTslForLoop(node) &&
            isTslAssignment(node.definitionStatement) &&
            isTslPlaceholder(node.definitionStatement.assignee)
        ) {
            const description = this.descriptions.createDescription(node.definitionStatement.assignee, name, document);
            this.addToScopesIfKeyIsDefined(scopes, node.block, description);
        } else if (isTslForeachLoop(node)) {
            const description = this.descriptions.createDescription(node, name, document);
            this.addToScopesIfKeyIsDefined(scopes, node.element, description);
            this.addToScopesIfKeyIsDefined(scopes, node.block, description);
        }
        /*
        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
            */
    }

    private processTslConditionalStatement(
        node: TslConditionalStatement,
        document: LangiumDocument,
        scopes: PrecomputedScopes,
    ): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        this.addToScopesIfKeyIsDefined(scopes, node.ifBlock, description);
        this.addToScopesIfKeyIsDefined(scopes, node.elseBlock, description);

        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
    }

    private processTslTimespanStatement(
        node: TslTimespanStatement,
        document: LangiumDocument,
        scopes: PrecomputedScopes,
    ): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);
        this.addToScopesIfKeyIsDefined(scopes, node.block, description);
    }

    /**
     * Adds the key/value pair to the scopes if the key is defined.
     *
     * @param scopes The scopes to add the key/value pair to.
     * @param key The key.
     * @param value The value.
     */
    addToScopesIfKeyIsDefined(scopes: PrecomputedScopes, key: AstNode | undefined, value: AstNodeDescription): void {
        if (key) {
            scopes.add(key, value);
        }
    }
}
