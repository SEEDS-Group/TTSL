import {
    AstNode,
    AstNodeDescription,
    AstUtils,
    DefaultScopeComputation,
    LangiumDocument,
    PrecomputedScopes,
} from 'langium';
import {
    isTslDeclaration,
    isTslFunction,
    isTslModule,
    isTslParameter,
    isTslParameterList,
    TslFunction,
    TslParameter,
} from '../generated/ast.js';

export class SafeDsScopeComputation extends DefaultScopeComputation {
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

        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
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
