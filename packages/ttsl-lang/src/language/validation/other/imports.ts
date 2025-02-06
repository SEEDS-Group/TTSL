import { ValidationAcceptor } from 'langium';
import { TslImport } from '../../generated/ast.js';
import { TTSLServices } from '../../ttsl-module.js';
import { isEmpty } from '../../../helpers/collections.js';

export const CODE_IMPORT_MISSING_PACKAGE = 'import/missing-package';
export const CODE_IMPORT_EMPTY_PACKAGE = 'import/empty-package';

export const importPackageMustExist =
    (services: TTSLServices) =>
    (node: TslImport, accept: ValidationAcceptor): void => {
        if (!services.workspace.PackageManager.hasPackage(node.package)) {
            accept('error', `The package '${node.package}' does not exist.`, {
                node,
                property: 'package',
            });
        }
    };

export const importPackageShouldNotBeEmpty =
    (services: TTSLServices) =>
    (node: TslImport, accept: ValidationAcceptor): void => {
        const declarationsInPackage = services.workspace.PackageManager.getDeclarationsInPackage(node.package);
        if (isEmpty(declarationsInPackage)) {
            accept('warning', `The package '${node.package}' is empty.`, {
                node,
                property: 'package',
            });
        }
    };
