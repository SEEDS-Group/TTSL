import {
    AstNode,
    AstNodeDescription,
    AstReflection,
    AstUtils,
    DefaultScopeProvider,
    EMPTY_SCOPE,
    ReferenceInfo,
    Scope,
    WorkspaceCache,
} from 'langium';
import {
    isTslAbstractCall,
    isTslArgument,
    isTslAssignment,
    isTslBlock,
    isTslCallable,
    isTslDeclaration,
    isTslImportedDeclaration,
    isTslModule,
    isTslParameter,
    isTslPlaceholder,
    isTslQualifiedImport,
    isTslReference,
    isTslStatement,
    isTslWildcardImport,
    TslArgument,
    type TslCallable,
    TslDeclaration,
    TslImportedDeclaration,
    type TslParameter,
    TslPlaceholder,
    TslReference,
    TslStatement,
} from '../generated/ast.js';
import { isContainedInOrEqual } from '../helpers/astUtils.js';
import {
    getAssignees,
    getImportedDeclarations,
    getImports,
    getPackageName,
    getParameters,
    getStatements,
} from '../helpers/nodeProperties.js';
import { TTSLNodeMapper } from '../helpers/ttsl-node-mapper.js';
import { TTSLServices } from '../ttsl-module.js';
import { TTSLPackageManager } from '../workspace/ttsl-package-manager.js';

export class TTSLScopeProvider extends DefaultScopeProvider {
    private readonly astReflection: AstReflection;
    private readonly nodeMapper: TTSLNodeMapper;
    private readonly packageManager: TTSLPackageManager;

    private readonly coreDeclarationCache: WorkspaceCache<string, AstNodeDescription[]>;

    constructor(services: TTSLServices) {
        super(services);

        this.astReflection = services.shared.AstReflection;
        this.nodeMapper = services.helpers.NodeMapper;
        this.packageManager = services.workspace.PackageManager;

        this.coreDeclarationCache = new WorkspaceCache(services.shared);
    }

    override getScope(context: ReferenceInfo): Scope {
        const node = context.container;

        if (isTslArgument(node) && context.property === 'parameter') {
            return this.getScopeForArgumentParameter(node);
        } else if (isTslImportedDeclaration(node) && context.property === 'declaration') {
            return this.getScopeForImportedDeclarationDeclaration(node);
        } else if (isTslReference(node) && context.property === 'target') {
            return this.getScopeForReferenceTarget(node, context);
        } else {
            return super.getScope(context);
        }
    }

    private getScopeForArgumentParameter(node: TslArgument): Scope {
        const containingAbstractCall = AstUtils.getContainerOfType(node, isTslAbstractCall);
        const callable = this.nodeMapper.callToCallable(containingAbstractCall);
        if (!callable) {
            return EMPTY_SCOPE;
        }

        const parameters = getParameters(callable);
        return this.createScopeForNodes(parameters);
    }

    private getScopeForImportedDeclarationDeclaration(node: TslImportedDeclaration): Scope {
        const ownPackageName = getPackageName(node);

        const containingQualifiedImport = AstUtils.getContainerOfType(node, isTslQualifiedImport);
        if (!containingQualifiedImport) {
            /* c8 ignore next 2 */
            return EMPTY_SCOPE;
        }

        const declarationsInPackage = this.packageManager.getDeclarationsInPackage(containingQualifiedImport.package, {
            nodeType: TslDeclaration,
            hideInternal: containingQualifiedImport.package !== ownPackageName,
        });
        return this.createScope(declarationsInPackage);
    }

    private getScopeForReferenceTarget(node: TslReference, context: ReferenceInfo): Scope {
        // Declarations in other files
        let currentScope = this.getGlobalScope(TslDeclaration, context);

        // Declarations in this file
        currentScope = this.globalDeclarationsInSameFile(node, currentScope);

        // Declarations in containing declarations
        currentScope = this.containingDeclarations(node, currentScope);

        // Declarations in containing blocks
        currentScope = this.localDeclarations(node, currentScope);

        // Core declarations
        return this.coreDeclarations(TslDeclaration, currentScope);
    }

    private containingDeclarations(node: AstNode, outerScope: Scope): Scope {
        const result = [];

        // Cannot reference the target of an annotation call from inside the annotation call
        let start: AstNode | undefined;

        // Only containing classes, enums, and enum variants can be referenced
        let current = AstUtils.getContainerOfType(start, isTslDeclaration);
        while (current) {
            result.push(current);
            current = AstUtils.getContainerOfType(current.$container, isTslDeclaration);
        }

        return this.createScopeForNodes(result, outerScope);
    }

    private globalDeclarationsInSameFile(node: AstNode, outerScope: Scope): Scope {
        const module = AstUtils.getContainerOfType(node, isTslModule);
        if (!module) {
            /* c8 ignore next 2 */
            return outerScope;
        }

        const precomputed = AstUtils.getDocument(module).precomputedScopes?.get(module);
        if (!precomputed) {
            /* c8 ignore next 2 */
            return outerScope;
        }

        return this.createScope(precomputed, outerScope);
    }

    private localDeclarations(node: AstNode, outerScope: Scope): Scope {
        const containingCallable = AstUtils.getContainerOfType(node.$container, isTslCallable);

        // Parameters (up to the containing parameter)
        const containingParameter = AstUtils.getContainerOfType(node, isTslParameter);

        let parameters: Iterable<TslParameter>;
        if (containingCallable && containingParameter) {
            parameters = this.parametersUpToParameter(containingCallable, containingParameter);
        } else {
            parameters = getParameters(containingCallable);
        }

        // Placeholders up to the containing statement
        const containingStatement = AstUtils.getContainerOfType(node.$container, isTslStatement);

        let placeholders: Iterable<TslPlaceholder>;
        if (!containingCallable || isContainedInOrEqual(containingStatement, containingCallable)) {
            placeholders = this.placeholdersUpToStatement(containingStatement);
        } else {
            // Placeholders are further away than the parameters
            placeholders = [];
        }

        // Local declarations
        const localDeclarations = [...parameters, ...placeholders];

        return this.createScopeForNodes(localDeclarations, outerScope);
    }

    private *parametersUpToParameter(
        callable: TslCallable,
        parameter: TslParameter,
    ): Generator<TslParameter, void, undefined> {
        for (const current of getParameters(callable)) {
            if (current === parameter) {
                return;
            }

            yield current;
        }
    }

    private *placeholdersUpToStatement(
        statement: TslStatement | undefined,
    ): Generator<TslPlaceholder, void, undefined> {
        if (!statement) {
            return;
        }

        const containingBlock = AstUtils.getContainerOfType(statement, isTslBlock);
        for (const current of getStatements(containingBlock)) {
            if (current === statement) {
                return;
            }

            if (isTslAssignment(current)) {
                yield* getAssignees(current).filter(isTslPlaceholder);
            }
        }
    }

    protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
        const node = context.container;
        const key = `${AstUtils.getDocument(node).uri}~${referenceType}`;
        return this.globalScopeCache.get(key, () => this.getGlobalScopeForNode(referenceType, node));
    }

    private getGlobalScopeForNode(referenceType: string, node: AstNode): Scope {
        const ownPackageName = getPackageName(node);

        // Builtin declarations
        const builtinDeclarations = this.builtinDeclarations(referenceType);
        let outerScope = this.createScope(builtinDeclarations);

        // Declarations in the same package
        const declarationsInSamePackage = this.declarationsInSamePackage(ownPackageName, referenceType);
        outerScope = this.createScope(declarationsInSamePackage, outerScope);

        // Explicitly imported declarations
        const explicitlyImportedDeclarations = this.explicitlyImportedDeclarations(referenceType, node);
        return this.createScope(explicitlyImportedDeclarations, outerScope);
    }

    private builtinDeclarations(referenceType: string): AstNodeDescription[] {
        return this.packageManager.getDeclarationsInPackageOrSubpackage('TTSL', {
            nodeType: referenceType,
            hideInternal: true,
        });
    }

    private declarationsInSamePackage(packageName: string | undefined, referenceType: string): AstNodeDescription[] {
        if (!packageName) {
            return [];
        }

        return this.packageManager.getDeclarationsInPackage(packageName, {
            nodeType: referenceType,
        });
    }

    private explicitlyImportedDeclarations(referenceType: string, node: AstNode): AstNodeDescription[] {
        const containingModule = AstUtils.getContainerOfType(node, isTslModule);
        const imports = getImports(containingModule);

        const result: AstNodeDescription[] = [];
        for (const imp of imports) {
            if (isTslQualifiedImport(imp)) {
                for (const importedDeclaration of getImportedDeclarations(imp)) {
                    const description = importedDeclaration.declaration?.$nodeDescription;
                    if (!description || !this.astReflection.isSubtype(description.type, referenceType)) {
                        continue;
                    }

                    if (importedDeclaration.alias) {
                        result.push({ ...description, name: importedDeclaration.alias.alias });
                    } else {
                        result.push(description);
                    }
                }
            } else if (isTslWildcardImport(imp)) {
                const declarationsInPackage = this.packageManager.getDeclarationsInPackage(imp.package, {
                    nodeType: referenceType,
                    hideInternal: true,
                });
                result.push(...declarationsInPackage);
            }
        }

        return result;
    }

    private coreDeclarations(referenceType: string, outerScope: Scope): Scope {
        const descriptions = this.coreDeclarationCache.get(referenceType, () =>
            this.packageManager.getDeclarationsInPackage('TTSL.lang', {
                nodeType: referenceType,
                hideInternal: true,
            }),
        );
        return this.createScope(descriptions, outerScope);
    }
}
