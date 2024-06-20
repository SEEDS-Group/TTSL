import {
    AstNode,
    AstNodeDescription,
    AstUtils,
    DefaultScopeComputation,
    LangiumDocument,
    PrecomputedScopes,
} from 'langium';
import {
    isTslAnnotation,
    isTslClass,
    isTslDeclaration,
    isTslEnum,
    isTslEnumVariant,
    isTslFunction,
    isTslModule,
    isTslParameter,
    isTslParameterList,
    isTslPipeline,
    isTslSegment,
    isTslTypeParameter,
    isTslTypeParameterList,
    TslClass,
    TslEnum,
    TslEnumVariant,
    TslFunction,
    TslParameter,
    TslTypeParameter,
} from '../generated/ast.js';

export class SafeDsScopeComputation extends DefaultScopeComputation {
    protected override exportNode(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument): void {
        // Modules, pipelines, and private segments cannot be referenced from other documents
        if (isTslModule(node) || isTslPipeline(node) || (isTslSegment(node) && (node.visibility?.isPrivate ?? false))) {
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
        if (isTslClass(node)) {
            this.processTslClass(node, document, scopes);
        } else if (isTslFunction(node)) {
            this.processTslFunction(node, document, scopes);
        } else if (isTslEnum(node)) {
            this.processTslEnum(node, document, scopes);
        } else if (isTslEnumVariant(node)) {
            this.processTslEnumVariant(node, document, scopes);
        } else if (isTslParameter(node)) {
            this.processTslParameter(node, document, scopes);
        } else if (isTslTypeParameter(node)) {
            this.processTslTypeParameter(node, document, scopes);
        } else {
            super.processNode(node, document, scopes);
        }
    }

    private processTslClass(node: TslClass, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        this.addToScopesIfKeyIsDefined(scopes, node.parameterList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.parentTypeList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.constraintList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.body, description);

        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
    }

    private processTslFunction(node: TslFunction, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        this.addToScopesIfKeyIsDefined(scopes, node.parameterList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.constraintList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.body, description);

        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
    }

    private processTslEnum(node: TslEnum, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        this.addToScopesIfKeyIsDefined(scopes, node.body, description);

        const containingDeclaration = AstUtils.getContainerOfType(node.$container, isTslDeclaration);
        if (isTslModule(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration, description);
        }
    }

    private processTslEnumVariant(node: TslEnumVariant, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const name = this.nameProvider.getName(node);
        if (!name) {
            /* c8 ignore next 2 */
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        this.addToScopesIfKeyIsDefined(scopes, node.parameterList, description);
        this.addToScopesIfKeyIsDefined(scopes, node.constraintList, description);
    }

    private processTslParameter(node: TslParameter, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const containingCallable = AstUtils.getContainerOfType(node, isTslParameterList)?.$container;
        if (!containingCallable) {
            /* c8 ignore next 2 */
            return;
        }

        const name = this.nameProvider.getName(node);
        if (!name) {
            /* c8 ignore next 2 */
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        if (isTslAnnotation(containingCallable)) {
            this.addToScopesIfKeyIsDefined(scopes, containingCallable.constraintList, description);
        } else if (isTslClass(containingCallable)) {
            this.addToScopesIfKeyIsDefined(scopes, containingCallable.constraintList, description);
        } else if (isTslEnumVariant(containingCallable)) {
            this.addToScopesIfKeyIsDefined(scopes, containingCallable.constraintList, description);
        } else if (isTslFunction(containingCallable)) {
            this.addToScopesIfKeyIsDefined(scopes, containingCallable.constraintList, description);
        } else if (isTslSegment(containingCallable)) {
            this.addToScopesIfKeyIsDefined(scopes, containingCallable.constraintList, description);
        }
    }

    private processTslTypeParameter(
        node: TslTypeParameter,
        document: LangiumDocument,
        scopes: PrecomputedScopes,
    ): void {
        const containingDeclaration = AstUtils.getContainerOfType(node, isTslTypeParameterList)?.$container;
        if (!containingDeclaration) {
            /* c8 ignore next 2 */
            return;
        }

        const name = this.nameProvider.getName(node);
        if (!name) {
            /* c8 ignore next 2 */
            return;
        }

        const description = this.descriptions.createDescription(node, name, document);

        if (isTslClass(containingDeclaration)) {
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration.parameterList, description);
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration.parentTypeList, description);
            this.addToScopesIfKeyIsDefined(scopes, containingDeclaration.body, description);
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
