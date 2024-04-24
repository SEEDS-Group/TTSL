import { isTslClass, TslClass } from '../generated/ast.js';
import { SafeDsModuleMembers } from './safe-ds-module-members.js';
import { resourceNameToUri } from '../../helpers/resources.js';

const CORE_CLASSES_URI = resourceNameToUri('builtins/safeds/lang/coreClasses.Tslstub');

export class SafeDsClasses extends SafeDsModuleMembers<TslClass> {
    get Any(): TslClass | undefined {
        return this.getClass('Any');
    }

    get Boolean(): TslClass | undefined {
        return this.getClass('Boolean');
    }

    get Float(): TslClass | undefined {
        return this.getClass('Float');
    }

    get Int(): TslClass | undefined {
        return this.getClass('Int');
    }

    get List(): TslClass | undefined {
        return this.getClass('List');
    }

    get Map(): TslClass | undefined {
        return this.getClass('Map');
    }

    get Nothing(): TslClass | undefined {
        return this.getClass('Nothing');
    }

    get Number(): TslClass | undefined {
        return this.getClass('Number');
    }

    get String(): TslClass | undefined {
        return this.getClass('String');
    }

    /**
     * Returns whether the given node is a builtin class.
     */
    isBuiltinClass(node: TslClass | undefined): boolean {
        return (
            Boolean(node) &&
            [
                this.Any,
                this.Boolean,
                this.Float,
                this.Int,
                this.List,
                this.Map,
                this.Nothing,
                this.Number,
                this.String,
            ].includes(node)
        );
    }

    private getClass(name: string): TslClass | undefined {
        return this.getModuleMember(CORE_CLASSES_URI, name, isTslClass);
    }
}
