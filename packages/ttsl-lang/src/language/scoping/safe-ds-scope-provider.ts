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
    isTslAnnotationCall,
    isTslArgument,
    isTslAssignment,
    isTslBlock,
    isTslCall,
    isTslCallable,
    isTslClass,
    isTslEnum,
    isTslImportedDeclaration,
    isTslLambda,
    isTslMemberAccess,
    isTslMemberType,
    isTslModule,
    isTslNamedType,
    isTslNamedTypeDeclaration,
    isTslParameter,
    isTslPlaceholder,
    isTslQualifiedImport,
    isTslReference,
    isTslSegment,
    isTslStatement,
    isTslTypeArgument,
    isTslTypeParameter,
    isTslWildcardImport,
    isTslYield,
    TslAnnotation,
    TslArgument,
    type TslCallable,
    TslDeclaration,
    TslExpression,
    TslImportedDeclaration,
    TslMemberAccess,
    TslMemberType,
    TslNamedType,
    TslNamedTypeDeclaration,
    type TslParameter,
    TslPlaceholder,
    TslReference,
    TslStatement,
    TslType,
    TslTypeArgument,
    TslYield,
} from '../generated/ast.js';
import { isContainedInOrEqual } from '../helpers/astUtils.js';
import {
    getAbstractResults,
    getAnnotationCallTarget,
    getAssignees,
    getClassMembers,
    getEnumVariants,
    getImportedDeclarations,
    getImports,
    getPackageName,
    getParameters,
    getResults,
    getStatements,
    getTypeParameters,
    isStatic,
} from '../helpers/nodeProperties.js';
import { SafeDsNodeMapper } from '../helpers/safe-ds-node-mapper.js';
import { SafeDsServices } from '../safe-ds-module.js';
import { ClassType, EnumVariantType, LiteralType, TypeParameterType } from '../typing/model.js';
import type { SafeDsClassHierarchy } from '../typing/safe-ds-class-hierarchy.js';
import { SafeDsTypeComputer } from '../typing/safe-ds-type-computer.js';
import { SafeDsPackageManager } from '../workspace/safe-ds-package-manager.js';

export class SafeDsScopeProvider extends DefaultScopeProvider {
    private readonly astReflection: AstReflection;
    private readonly classHierarchy: SafeDsClassHierarchy;
    private readonly nodeMapper: SafeDsNodeMapper;
    private readonly packageManager: SafeDsPackageManager;
    private readonly typeComputer: SafeDsTypeComputer;

    private readonly coreDeclarationCache: WorkspaceCache<string, AstNodeDescription[]>;

    constructor(services: SafeDsServices) {
        super(services);

        this.astReflection = services.shared.AstReflection;
        this.classHierarchy = services.types.ClassHierarchy;
        this.nodeMapper = services.helpers.NodeMapper;
        this.packageManager = services.workspace.PackageManager;
        this.typeComputer = services.types.TypeComputer;

        this.coreDeclarationCache = new WorkspaceCache(services.shared);
    }

    override getScope(context: ReferenceInfo): Scope {
        const node = context.container;

        if (isTslAnnotationCall(node) && context.property === 'annotation') {
            return this.getScopeForAnnotationCallAnnotation(context);
        } else if (isTslArgument(node) && context.property === 'parameter') {
            return this.getScopeForArgumentParameter(node);
        } else if (isTslImportedDeclaration(node) && context.property === 'declaration') {
            return this.getScopeForImportedDeclarationDeclaration(node);
        } else if (isTslNamedType(node) && context.property === 'declaration') {
            if (isTslMemberType(node.$container) && node.$containerProperty === 'member') {
                return this.getScopeForMemberTypeMember(node.$container);
            } else {
                return this.getScopeForNamedTypeDeclaration(node, context);
            }
        } else if (isTslReference(node) && context.property === 'target') {
            if (isTslMemberAccess(node.$container) && node.$containerProperty === 'member') {
                return this.getScopeForMemberAccessMember(node.$container);
            } else {
                return this.getScopeForReferenceTarget(node, context);
            }
        } else if (isTslTypeArgument(node) && context.property === 'typeParameter') {
            return this.getScopeForTypeArgumentTypeParameter(node);
        } else if (isTslYield(node) && context.property === 'result') {
            return this.getScopeForYieldResult(node);
        } else {
            return super.getScope(context);
        }
    }

    private getScopeForAnnotationCallAnnotation(context: ReferenceInfo) {
        return this.coreDeclarations(TslAnnotation, super.getScope(context));
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

    private getScopeForMemberTypeMember(node: TslMemberType): Scope {
        const declaration = this.getUniqueReferencedDeclarationForType(node.receiver);
        if (!declaration) {
            return EMPTY_SCOPE;
        }

        if (isTslClass(declaration)) {
            const members = declaration.body?.members ?? [];
            return this.createScopeForNodes(members.filter(isTslNamedTypeDeclaration));
        } else if (isTslEnum(declaration)) {
            const variants = declaration.body?.variants ?? [];
            return this.createScopeForNodes(variants);
        } else {
            return EMPTY_SCOPE;
        }
    }

    /**
     * Returns the unique declaration that is referenced by this type. If the type references none or multiple
     * declarations, undefined is returned.
     *
     * @param node The type to get the referenced declaration for.
     * @returns The referenced declaration or undefined.
     */
    private getUniqueReferencedDeclarationForType(node: TslType): TslNamedTypeDeclaration | undefined {
        if (isTslNamedType(node)) {
            return node.declaration?.ref;
        } else if (isTslMemberType(node)) {
            return node.member?.declaration?.ref;
        } else {
            return undefined;
        }
    }

    private getScopeForNamedTypeDeclaration(node: TslNamedType, context: ReferenceInfo): Scope {
        // Default scope
        let currentScope = this.coreDeclarations(TslNamedTypeDeclaration, super.getScope(context));

        // Type parameters (up to the containing type parameter)
        const containingTypeParameter = AstUtils.getContainerOfType(node, isTslTypeParameter);
        if (containingTypeParameter) {
            const allTypeParameters = getTypeParameters(containingTypeParameter?.$container);
            const priorTypeParameters = allTypeParameters.slice(0, containingTypeParameter.$containerIndex);
            currentScope = this.createScopeForNodes(priorTypeParameters, currentScope);
        }

        return currentScope;
    }

    private getScopeForMemberAccessMember(node: TslMemberAccess): Scope {
        // Static access
        const declaration = this.getUniqueReferencedDeclarationForExpression(node.receiver);
        if (isTslClass(declaration)) {
            const ownStaticMembers = getClassMembers(declaration).filter(isStatic);
            const superclassStaticMembers = this.classHierarchy.streamSuperclassMembers(declaration).filter(isStatic);

            return this.createScopeForNodes(ownStaticMembers, this.createScopeForNodes(superclassStaticMembers));
        } else if (isTslEnum(declaration)) {
            return this.createScopeForNodes(getEnumVariants(declaration));
        }

        // Call results
        let resultScope = EMPTY_SCOPE;
        if (isTslCall(node.receiver)) {
            const callable = this.nodeMapper.callToCallable(node.receiver);
            const results = getAbstractResults(callable);

            if (results.length > 1) {
                return this.createScopeForNodes(results);
            } else {
                // If there is only one result, it can be accessed by name but members of the result with the same name
                // take precedence.
                resultScope = this.createScopeForNodes(results);
            }
        }

        // Members
        let receiverType = this.typeComputer.computeType(node.receiver);
        if (receiverType instanceof LiteralType) {
            receiverType = this.typeComputer.computeClassTypeForLiteralType(receiverType);
        } else if (receiverType instanceof TypeParameterType) {
            receiverType = this.typeComputer.computeUpperBound(receiverType);
        }

        if (receiverType instanceof ClassType) {
            const ownInstanceMembers = getClassMembers(receiverType.declaration).filter((it) => !isStatic(it));
            const superclassInstanceMembers = this.classHierarchy
                .streamSuperclassMembers(receiverType.declaration)
                .filter((it) => !isStatic(it));

            return this.createScopeForNodes(
                ownInstanceMembers,
                this.createScopeForNodes(superclassInstanceMembers, resultScope),
            );
        } else if (receiverType instanceof EnumVariantType) {
            const parameters = getParameters(receiverType.declaration);
            return this.createScopeForNodes(parameters, resultScope);
        }

        return resultScope;
    }

    /**
     * Returns the unique declaration that is referenced by this expression. If the expression references none or
     * multiple declarations, undefined is returned.
     *
     * @param node The expression to get the referenced declaration for.
     * @returns The referenced declaration or undefined.
     */
    private getUniqueReferencedDeclarationForExpression(node: TslExpression): TslDeclaration | undefined {
        if (isTslReference(node)) {
            return node.target.ref;
        } else if (isTslMemberAccess(node)) {
            return node.member?.target?.ref;
        } else {
            return undefined;
        }
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
        const containingAnnotationCall = AstUtils.getContainerOfType(node, isTslAnnotationCall);
        if (containingAnnotationCall) {
            start = getAnnotationCallTarget(containingAnnotationCall)?.$container;
        } else {
            start = node.$container;
        }

        // Only containing classes, enums, and enum variants can be referenced
        let current = AstUtils.getContainerOfType(start, isTslNamedTypeDeclaration);
        while (current) {
            result.push(current);
            current = AstUtils.getContainerOfType(current.$container, isTslNamedTypeDeclaration);
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

        // Lambdas can be nested
        if (isTslLambda(containingCallable)) {
            return this.createScopeForNodes(localDeclarations, this.localDeclarations(containingCallable, outerScope));
        } else {
            return this.createScopeForNodes(localDeclarations, outerScope);
        }
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

    private getScopeForTypeArgumentTypeParameter(node: TslTypeArgument): Scope {
        const containingNamedType = AstUtils.getContainerOfType(node, isTslNamedType);
        if (!containingNamedType) {
            /* c8 ignore next 2 */
            return EMPTY_SCOPE;
        }

        const namedTypeDeclaration = containingNamedType.declaration?.ref;
        if (isTslClass(namedTypeDeclaration)) {
            const typeParameters = getTypeParameters(namedTypeDeclaration.typeParameterList);
            return this.createScopeForNodes(typeParameters);
        } else {
            return EMPTY_SCOPE;
        }
    }

    private getScopeForYieldResult(node: TslYield): Scope {
        const containingSegment = AstUtils.getContainerOfType(node, isTslSegment);
        if (!containingSegment) {
            return EMPTY_SCOPE;
        }

        return this.createScopeForNodes(getResults(containingSegment.resultList));
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
        return this.packageManager.getDeclarationsInPackageOrSubpackage('safeds', {
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
            this.packageManager.getDeclarationsInPackage('safeds.lang', {
                nodeType: referenceType,
                hideInternal: true,
            }),
        );
        return this.createScope(descriptions, outerScope);
    }
}
