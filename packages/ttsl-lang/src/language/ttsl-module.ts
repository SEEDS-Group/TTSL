import { DeepPartial, inject, Module } from 'langium';
import {
    createDefaultModule,
    createDefaultSharedModule,
    DefaultSharedModuleContext,
    LangiumServices,
    LangiumSharedServices,
    PartialLangiumServices,
} from 'langium/lsp';
import { TTSLCommentProvider } from './documentation/ttsl-comment-provider.js';
import { TTSLDocumentationProvider } from './documentation/ttsl-documentation-provider.js';
import { TTSLCallGraphComputer } from './flow/ttsl-call-graph-computer.js';
import { TTSLGeneratedModule, TTSLGeneratedSharedModule } from './generated/module.js';
import { TTSLPythonGenerator } from './generation/ttsl-python-generator.js';
import { TTSLValueConverter } from './grammar/ttsl-value-converter.js';
import { TTSLNodeMapper } from './helpers/ttsl-node-mapper.js';
import { TTSLCallHierarchyProvider } from './lsp/ttsl-call-hierarchy-provider.js';
import { TTSLDocumentSymbolProvider } from './lsp/ttsl-document-symbol-provider.js';
import { TTSLFormatter } from './lsp/ttsl-formatter.js';
import { TTSLInlayHintProvider } from './lsp/ttsl-inlay-hint-provider.js';
import { TTSLNodeInfoProvider } from './lsp/ttsl-node-info-provider.js';
import { TTSLNodeKindProvider } from './lsp/ttsl-node-kind-provider.js';
import { TTSLSemanticTokenProvider } from './lsp/ttsl-semantic-token-provider.js';
import { TTSLSignatureHelpProvider } from './lsp/ttsl-signature-help-provider.js';
import { TTSLPartialEvaluator } from './partialEvaluation/ttsl-partial-evaluator.js';
import { TTSLScopeComputation } from './scoping/ttsl-scope-computation.js';
import { TTSLScopeProvider } from './scoping/ttsl-scope-provider.js';
import { TTSLTypeChecker } from './typing/ttsl-type-checker.js';
import { TTSLTypeComputer } from './typing/ttsl-type-computer.js';
import { registerValidationChecks } from './validation/ttsl-validator.js';
import { TTSLDocumentBuilder } from './workspace/ttsl-document-builder.js';
import { TTSLPackageManager } from './workspace/ttsl-package-manager.js';
import { TTSLWorkspaceManager } from './workspace/ttsl-workspace-manager.js';
import { TTSLSettingsProvider } from './workspace/ttsl-settings-provider.js';
import { TTSLRenameProvider } from './lsp/ttsl-rename-provider.js';
import { TTSLFunction } from './builtins/ttsl-functions.js';
import { TTSLMessagingProvider } from './communication/ttsl-messaging-provider.js';
import { TTSLPythonServer } from './runtime/ttsl-python-server.js';
import { TTSLRunner } from './runtime/ttsl-runner.js';
import { TTSLSlicer } from './flow/ttsl-slicer.js';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type TTSLAddedServices = {
    builtins: {
        Functions: TTSLFunction;
    };
    communication: {
        MessagingProvider: TTSLMessagingProvider;
    };
    evaluation: {
        PartialEvaluator: TTSLPartialEvaluator;
    };
    flow: {
        CallGraphComputer: TTSLCallGraphComputer;
        Slicer: TTSLSlicer;
    };
    generation: {
        PythonGenerator: TTSLPythonGenerator;
    };
    helpers: {
        NodeMapper: TTSLNodeMapper;
    };
    lsp: {
        NodeInfoProvider: TTSLNodeInfoProvider;
    };
    runtime: {
        PythonServer: TTSLPythonServer;
        Runner: TTSLRunner;
    };
    types: {
        TypeChecker: TTSLTypeChecker;
        TypeComputer: TTSLTypeComputer;
    };
    workspace: {
        PackageManager: TTSLPackageManager;
        SettingsProvider: TTSLSettingsProvider;
    };
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type TTSLServices = LangiumServices & TTSLAddedServices;

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const TTSLModule: Module<TTSLServices, PartialLangiumServices & TTSLAddedServices> = {
    builtins: {
        Functions: (services) => new TTSLFunction(services),
    },
    communication: {
        MessagingProvider: (services) => new TTSLMessagingProvider(services),
    },
    documentation: {
        CommentProvider: (services) => new TTSLCommentProvider(services),
        DocumentationProvider: (services) => new TTSLDocumentationProvider(services),
    },
    evaluation: {
        PartialEvaluator: (services) => new TTSLPartialEvaluator(services),
    },
    flow: {
        CallGraphComputer: (services) => new TTSLCallGraphComputer(services),
        Slicer: (services) => new TTSLSlicer(services),
    },
    generation: {
        PythonGenerator: (services) => new TTSLPythonGenerator(services),
    },
    helpers: {
        NodeMapper: (services) => new TTSLNodeMapper(services),
    },
    lsp: {
        CallHierarchyProvider: (services) => new TTSLCallHierarchyProvider(services),
        DocumentSymbolProvider: (services) => new TTSLDocumentSymbolProvider(services),
        Formatter: () => new TTSLFormatter(),
        InlayHintProvider: (services) => new TTSLInlayHintProvider(services),
        NodeInfoProvider: (services) => new TTSLNodeInfoProvider(services),
        RenameProvider: (services) => new TTSLRenameProvider(services),
        SemanticTokenProvider: (services) => new TTSLSemanticTokenProvider(services),
        SignatureHelp: (services) => new TTSLSignatureHelpProvider(services),
    },
    parser: {
        ValueConverter: () => new TTSLValueConverter(),
    },
    references: {
        ScopeComputation: (services) => new TTSLScopeComputation(services),
        ScopeProvider: (services) => new TTSLScopeProvider(services),
    },
    runtime: {
        PythonServer: (services) => new TTSLPythonServer(services),
        Runner: (services) => new TTSLRunner(services),
    },
    types: {
        TypeChecker: () => new TTSLTypeChecker(),
        TypeComputer: (services) => new TTSLTypeComputer(services),
    },
    workspace: {
        PackageManager: (services) => new TTSLPackageManager(services),
        SettingsProvider: (services) => new TTSLSettingsProvider(services),
    },
};

export type TTSLSharedServices = LangiumSharedServices;

export const TTSLSharedModule: Module<TTSLSharedServices, DeepPartial<TTSLSharedServices>> = {
    lsp: {
        NodeKindProvider: () => new TTSLNodeKindProvider(),
    },
    workspace: {
        DocumentBuilder: (services) => new TTSLDocumentBuilder(services),
        WorkspaceManager: (services) => new TTSLWorkspaceManager(services),
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
 * @param options Further options to configure the TTSL module.
 * @return An object wrapping the shared services and the language-specific services.
 */
export const createTTSLServices = async function (
    context: DefaultSharedModuleContext,
    options?: ModuleOptions,
): Promise<{
    shared: LangiumSharedServices;
    TTSL: TTSLServices;
}> {
    const shared = inject(createDefaultSharedModule(context), TTSLGeneratedSharedModule, TTSLSharedModule);
    const TTSL = inject(createDefaultModule({ shared }), TTSLGeneratedModule, TTSLModule);

    shared.ServiceRegistry.register(TTSL);
    registerValidationChecks(TTSL);

    // If we don't run inside a language server, initialize the configuration provider instantly
    if (!context.connection) {
        await shared.workspace.ConfigurationProvider.initialized({});
    }

    // Apply options
    if (!options?.omitBuiltins) {
        await shared.workspace.WorkspaceManager.initializeWorkspace([]);
    }

    return { shared, TTSL };
};

/**
 * Options to pass to the creation of TTSL services.
 */
export interface ModuleOptions {
    /**
     * By default, builtins are loaded into the workspace. If this option is set to true, builtins are omitted.
     */
    omitBuiltins?: boolean;
}
