import {
    createDefaultModule,
    createDefaultSharedModule,
    DeepPartial,
    DefaultSharedModuleContext,
    inject,
    LangiumServices,
    LangiumSharedServices,
    Module,
    PartialLangiumServices,
} from 'langium';
import { SafeDsAnnotations } from './builtins/safe-ds-annotations.js';
import { SafeDsClasses } from './builtins/safe-ds-classes.js';
import { SafeDsEnums } from './builtins/safe-ds-enums.js';
import { SafeDsCommentProvider } from './documentation/safe-ds-comment-provider.js';
import { SafeDsDocumentationProvider } from './documentation/safe-ds-documentation-provider.js';
import { SafeDsGeneratedModule, SafeDsGeneratedSharedModule } from './generated/module.js';
import { SafeDsPythonGenerator } from './generation/safe-ds-python-generator.js';
import { SafeDsValueConverter } from './grammar/safe-ds-value-converter.js';
import { SafeDsNodeMapper } from './helpers/safe-ds-node-mapper.js';
import { SafeDsDocumentSymbolProvider } from './lsp/safe-ds-document-symbol-provider.js';
import { SafeDsFormatter } from './lsp/safe-ds-formatter.js';
import { SafeDsInlayHintProvider } from './lsp/safe-ds-inlay-hint-provider.js';
import { SafeDsNodeKindProvider } from './lsp/safe-ds-node-kind-provider.js';
import { SafeDsSemanticTokenProvider } from './lsp/safe-ds-semantic-token-provider.js';
import { SafeDsPartialEvaluator } from './partialEvaluation/safe-ds-partial-evaluator.js';
import { SafeDsScopeComputation } from './scoping/safe-ds-scope-computation.js';
import { SafeDsScopeProvider } from './scoping/safe-ds-scope-provider.js';
import { SafeDsClassHierarchy } from './typing/safe-ds-class-hierarchy.js';
import { SafeDsCoreTypes } from './typing/safe-ds-core-types.js';
import { SafeDsTypeChecker } from './typing/safe-ds-type-checker.js';
import { SafeDsTypeComputer } from './typing/safe-ds-type-computer.js';
import { registerValidationChecks } from './validation/safe-ds-validator.js';
import { SafeDsDocumentBuilder } from './workspace/safe-ds-document-builder.js';
import { SafeDsPackageManager } from './workspace/safe-ds-package-manager.js';
import { SafeDsWorkspaceManager } from './workspace/safe-ds-workspace-manager.js';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type SafeDsAddedServices = {
    builtins: {
        Annotations: SafeDsAnnotations;
        Classes: SafeDsClasses;
        Enums: SafeDsEnums;
    };
    evaluation: {
        PartialEvaluator: SafeDsPartialEvaluator;
    };
    generation: {
        PythonGenerator: SafeDsPythonGenerator;
    };
    helpers: {
        NodeMapper: SafeDsNodeMapper;
    };
    types: {
        ClassHierarchy: SafeDsClassHierarchy;
        CoreTypes: SafeDsCoreTypes;
        TypeChecker: SafeDsTypeChecker;
        TypeComputer: SafeDsTypeComputer;
    };
    workspace: {
        PackageManager: SafeDsPackageManager;
    };
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type SafeDsServices = LangiumServices & SafeDsAddedServices;

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const SafeDsModule: Module<SafeDsServices, PartialLangiumServices & SafeDsAddedServices> = {
    builtins: {
        Annotations: (services) => new SafeDsAnnotations(services),
        Classes: (services) => new SafeDsClasses(services),
        Enums: (services) => new SafeDsEnums(services),
    },
    documentation: {
        CommentProvider: (services) => new SafeDsCommentProvider(services),
        DocumentationProvider: (services) => new SafeDsDocumentationProvider(services),
    },
    evaluation: {
        PartialEvaluator: (services) => new SafeDsPartialEvaluator(services),
    },
    generation: {
        PythonGenerator: (services) => new SafeDsPythonGenerator(services),
    },
    helpers: {
        NodeMapper: (services) => new SafeDsNodeMapper(services),
    },
    lsp: {
        DocumentSymbolProvider: (services) => new SafeDsDocumentSymbolProvider(services),
        Formatter: () => new SafeDsFormatter(),
        InlayHintProvider: (services) => new SafeDsInlayHintProvider(services),
        SemanticTokenProvider: (services) => new SafeDsSemanticTokenProvider(services),
    },
    parser: {
        ValueConverter: () => new SafeDsValueConverter(),
    },
    references: {
        ScopeComputation: (services) => new SafeDsScopeComputation(services),
        ScopeProvider: (services) => new SafeDsScopeProvider(services),
    },
    types: {
        ClassHierarchy: (services) => new SafeDsClassHierarchy(services),
        CoreTypes: (services) => new SafeDsCoreTypes(services),
        TypeChecker: (services) => new SafeDsTypeChecker(services),
        TypeComputer: (services) => new SafeDsTypeComputer(services),
    },
    workspace: {
        PackageManager: (services) => new SafeDsPackageManager(services),
    },
};

export type SafeDsSharedServices = LangiumSharedServices;

export const SafeDsSharedModule: Module<SafeDsSharedServices, DeepPartial<SafeDsSharedServices>> = {
    lsp: {
        NodeKindProvider: () => new SafeDsNodeKindProvider(),
    },
    workspace: {
        DocumentBuilder: (services) => new SafeDsDocumentBuilder(services),
        WorkspaceManager: (services) => new SafeDsWorkspaceManager(services),
    },
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection.
 * @return An object wrapping the shared services and the language-specific services.
 */
export const createSafeDsServices = function (context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices;
    SafeDs: SafeDsServices;
} {
    const shared = inject(createDefaultSharedModule(context), SafeDsGeneratedSharedModule, SafeDsSharedModule);
    const SafeDs = inject(createDefaultModule({ shared }), SafeDsGeneratedModule, SafeDsModule);
    shared.ServiceRegistry.register(SafeDs);
    registerValidationChecks(SafeDs);
    return { shared, SafeDs };
};

/**
 * Create the full set of services required by Langium and load all builtin files into the workspace.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection.
 * @return An object wrapping the shared services and the language-specific services.
 */
/* c8 ignore start */
export const createSafeDsServicesWithBuiltins = async function (context: DefaultSharedModuleContext): Promise<{
    shared: LangiumSharedServices;
    SafeDs: SafeDsServices;
}> {
    const { shared, SafeDs } = createSafeDsServices(context);
    await shared.workspace.WorkspaceManager.initializeWorkspace([]);
    return { shared, SafeDs };
};
/* c8 ignore stop */