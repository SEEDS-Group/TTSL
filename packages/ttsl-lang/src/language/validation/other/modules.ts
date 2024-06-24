import { ValidationAcceptor } from 'langium';
import { TslModule } from '../../generated/ast.js';
import { getModuleMembers } from '../../helpers/nodeProperties.js';

export const CODE_MODULE_FORBIDDEN_IN_PIPELINE_FILE = 'module/forbidden-in-pipeline-file';
export const CODE_MODULE_FORBIDDEN_IN_STUB_FILE = 'module/forbidden-in-stub-file';
export const CODE_MODULE_MISSING_PACKAGE = 'module/missing-package';
export const CODE_MODULE_PIPELINE_FILE_IN_BUILTIN_PACKAGE = 'module/pipeline-file-in-builtin-package';

export const moduleWithDeclarationsMustStatePackage = (node: TslModule, accept: ValidationAcceptor): void => {
    if (!node.name) {
        const members = getModuleMembers(node);
        if (members.length > 0) {
            accept('error', 'A module with declarations must state its package.', {
                node: members[0]!,
                property: 'name',
                code: CODE_MODULE_MISSING_PACKAGE,
            });
        }
    }
};

