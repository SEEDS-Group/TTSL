import { AstUtils, URI } from 'langium';
import { resourceNameToUri } from '../../helpers/resources.js';
import { isTslEnum, TslEnum, type TslEnumVariant } from '../generated/ast.js';
import { getEnumVariants } from '../helpers/nodeProperties.js';
import { EvaluatedEnumVariant, EvaluatedNode } from '../partialEvaluation/model.js';
import type { SafeDsServices } from '../safe-ds-module.js';
import { SafeDsModuleMembers } from './safe-ds-module-members.js';

const ANNOTATION_USAGE_URI = resourceNameToUri('builtins/safeds/lang/annotationUsage.Tslstub');
const PURITY_URI = resourceNameToUri('builtins/safeds/lang/purity.Tslstub');

export class SafeDsEnums extends SafeDsModuleMembers<TslEnum> {
    get AnnotationTarget(): TslEnum | undefined {
        return this.getEnum(ANNOTATION_USAGE_URI, 'AnnotationTarget');
    }

    isEvaluatedAnnotationTarget = (node: EvaluatedNode): node is EvaluatedEnumVariant =>
        node instanceof EvaluatedEnumVariant &&
        AstUtils.getContainerOfType(node.variant, isTslEnum) === this.AnnotationTarget;

    get ImpurityReason(): TslEnum | undefined {
        return this.getEnum(PURITY_URI, 'ImpurityReason');
    }

    isEvaluatedImpurityReason = (node: EvaluatedNode): node is EvaluatedEnumVariant =>
        node instanceof EvaluatedEnumVariant &&
        AstUtils.getContainerOfType(node.variant, isTslEnum) === this.ImpurityReason;

    private getEnum(uri: URI, name: string): TslEnum | undefined {
        return this.getModuleMember(uri, name, isTslEnum);
    }
}

export class SafeDsImpurityReasons {
    private readonly builtinEnums: SafeDsEnums;

    constructor(services: SafeDsServices) {
        this.builtinEnums = services.builtins.Enums;
    }

    get FileReadFromConstantPath(): TslEnumVariant | undefined {
        return this.getEnumVariant('FileReadFromConstantPath');
    }

    get FileReadFromParameterizedPath(): TslEnumVariant | undefined {
        return this.getEnumVariant('FileReadFromParameterizedPath');
    }

    get FileWriteToConstantPath(): TslEnumVariant | undefined {
        return this.getEnumVariant('FileWriteToConstantPath');
    }

    get FileWriteToParameterizedPath(): TslEnumVariant | undefined {
        return this.getEnumVariant('FileWriteToParameterizedPath');
    }

    get PotentiallyImpureParameterCall(): TslEnumVariant | undefined {
        return this.getEnumVariant('PotentiallyImpureParameterCall');
    }

    get Other(): TslEnumVariant | undefined {
        return this.getEnumVariant('Other');
    }

    private getEnumVariant(name: string): TslEnumVariant | undefined {
        return getEnumVariants(this.builtinEnums.ImpurityReason).find((variant) => variant.name === name);
    }
}
