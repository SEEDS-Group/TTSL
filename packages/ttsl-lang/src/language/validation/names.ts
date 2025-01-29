import { AstNodeDescription, AstUtils, ValidationAcceptor } from 'langium';
import { duplicatesBy } from '../../helpers/collections.js';
import { listBuiltinFiles } from '../builtins/fileFinder.js';
import { BUILTINS_LANG_PACKAGE, BUILTINS_ROOT_PACKAGE } from '../builtins/packageNames.js';
import {
    isTslQualifiedImport,
    TslDeclaration,
    TslImportedDeclaration,
    TslModule,
} from '../generated/ast.js';
import { CODEGEN_PREFIX } from '../generation/ttsl-python-generator.js';
import {
    getImportedDeclarations,
    getImports,
    getModuleMembers,
    getPackageName,
} from '../helpers/nodeProperties.js';
import { TTSLServices } from '../ttsl-module.js';

export const CODE_NAME_CODEGEN_PREFIX = 'name/codegen-prefix';
export const CODE_NAME_CORE_DECLARATION = 'name/core-declaration';
export const CODE_NAME_DUPLICATE = 'name/duplicate';

// -----------------------------------------------------------------------------
// Codegen prefix
// -----------------------------------------------------------------------------

export const nameMustNotStartWithCodegenPrefix = (node: TslDeclaration, accept: ValidationAcceptor) => {
    const name = node.name ?? '';
    if (name.startsWith(CODEGEN_PREFIX)) {
        accept(
            'error',
            `Names of declarations must not start with '${CODEGEN_PREFIX}'. This is reserved for code generation.`,
            {
                node,
                property: 'name',
                code: CODE_NAME_CODEGEN_PREFIX,
            },
        );
    }
};

// -----------------------------------------------------------------------------
// Core declaration
// -----------------------------------------------------------------------------

export const nameMustNotOccurOnCoreDeclaration = (services: TTSLServices) => {
    const packageManager = services.workspace.PackageManager;

    return (node: TslDeclaration, accept: ValidationAcceptor) => {
        if (!node.name) {
            /* c8 ignore next 2 */
            return;
        }

        // Prevents the error from showing when editing the builtin files
        const packageName = getPackageName(node);
        if (packageName === BUILTINS_LANG_PACKAGE) {
            return;
        }

        const coreDeclarations = packageManager.getDeclarationsInPackage(BUILTINS_LANG_PACKAGE);
        if (coreDeclarations.some((it) => it.name === node.name)) {
            accept('error', 'Names of core declarations must not be used for own declarations.', {
                node,
                property: 'name',
                code: CODE_NAME_CORE_DECLARATION,
            });
        }
    };
};

// -----------------------------------------------------------------------------
// Uniqueness
// -----------------------------------------------------------------------------

export const moduleMemberMustHaveNameThatIsUniqueInPackage = (services: TTSLServices) => {
    const packageManager = services.workspace.PackageManager;
    const builtinUris = new Set(listBuiltinFiles().map((it) => it.toString()));

    return (node: TslModule, accept: ValidationAcceptor): void => {
        const moduleUri = AstUtils.getDocument(node).uri?.toString();
        if (builtinUris.has(moduleUri)) {
            return;
        }

        for (const member of getModuleMembers(node)) {
            const packageName = getPackageName(member) ?? '';

            let declarationsInPackage: AstNodeDescription[];
            let kind: string;
            if (packageName.startsWith(BUILTINS_ROOT_PACKAGE)) {
                // For a builtin package, the simple names of declarations must be unique
                declarationsInPackage = packageManager.getDeclarationsInPackageOrSubpackage(BUILTINS_ROOT_PACKAGE);
                kind = 'builtin declarations';
            } else {
                declarationsInPackage = packageManager.getDeclarationsInPackage(packageName);
                kind = 'declarations in this package';
            }

            if (
                declarationsInPackage.some(
                    (it) =>
                        it.name === member.name &&
                        it.documentUri.toString() !== moduleUri &&
                        !builtinUris.has(it.documentUri.toString()),
                )
            ) {
                accept('error', `Multiple ${kind} have the name '${member.name}'.`, {
                    node: member,
                    property: 'name',
                    code: CODE_NAME_DUPLICATE,
                });
            }
        }
    };
};

export const moduleMustContainUniqueNames = (node: TslModule, accept: ValidationAcceptor): void => {
    // Names of imported declarations must be unique
    const importedDeclarations = getImports(node).filter(isTslQualifiedImport).flatMap(getImportedDeclarations);
    for (const duplicate of duplicatesBy(importedDeclarations, importedDeclarationName)) {
        if (duplicate.alias) {
            accept('error', `A declaration with name '${importedDeclarationName(duplicate)}' was imported already.`, {
                node: duplicate.alias,
                property: 'alias',
                code: CODE_NAME_DUPLICATE,
            });
        } else {
            accept('error', `A declaration with name '${importedDeclarationName(duplicate)}' was imported already.`, {
                node: duplicate,
                property: 'declaration',
                code: CODE_NAME_DUPLICATE,
            });
        }
    }

    // Names of module members must be unique
    namesMustBeUnique(
        getModuleMembers(node),
        (name) => `A declaration with name '${name}' exists already in this file.`,
        accept,
    );
};

const importedDeclarationName = (node: TslImportedDeclaration | undefined): string | undefined => {
    return node?.alias?.alias ?? node?.declaration?.ref?.name;
};

const namesMustBeUnique = (
    nodes: Iterable<TslDeclaration>,
    createMessage: (name: string) => string,
    accept: ValidationAcceptor,
    shouldReportErrorOn: (node: TslDeclaration) => boolean = () => true,
): void => {
    for (const node of duplicatesBy(nodes, (it) => it.name)) {
        if (shouldReportErrorOn(node)) {
            accept('error', createMessage(node.name), {
                node,
                property: 'name',
                code: CODE_NAME_DUPLICATE,
            });
        }
    }
};
