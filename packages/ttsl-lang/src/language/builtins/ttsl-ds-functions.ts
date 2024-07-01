import { URI } from "langium";
import { resourceNameToUri } from "../../helpers/resources.js";
import { TslFunction, TslModule, TslObject, isTslFunction } from "../generated/ast.js";
import { SafeDsNodeMapper } from "../helpers/safe-ds-node-mapper.js";
import { EvaluatedNode, StringConstant, UnknownEvaluatedNode } from "../partialEvaluation/model.js";
import { SafeDsPartialEvaluator } from "../partialEvaluation/safe-ds-partial-evaluator.js";
import { SafeDsServices } from "../safe-ds-module.js";
import { SafeDsModuleMembers } from "./safe-ds-module-members.js";

const CODE_GENERATION_URI = resourceNameToUri('builtins/safeds/lang/codeGeneration.ttsl');

export class TTSLFunction extends SafeDsModuleMembers<TslFunction> {
    private readonly nodeMapper: SafeDsNodeMapper;
    private readonly partialEvaluator: SafeDsPartialEvaluator;

    constructor(services: SafeDsServices) {
        super(services);

        this.nodeMapper = services.helpers.NodeMapper;
        this.partialEvaluator = services.evaluation.PartialEvaluator;
    }

    getPythonCall(node: TslFunction | undefined): string | undefined {
        const value = this.getParameterValue(node, this.PythonCall, 'callSpecification');
        if (value instanceof StringConstant) {
            return value.value;
        } else {
            return undefined;
        }
    }

    get PythonCall(): TslFunction | undefined {
        return this.getFunction(CODE_GENERATION_URI, 'PythonCall');
    }

    getPythonModule(node: TslModule | undefined): string | undefined {
        const value = this.getParameterValue(node, this.PythonModule, 'qualifiedName');
        if (value instanceof StringConstant) {
            return value.value;
        } else {
            return undefined;
        }
    }

    get PythonModule(): TslFunction | undefined {
        return this.getFunction(CODE_GENERATION_URI, 'PythonModule');
    }

    getPythonName(node: TslObject | undefined): string | undefined {
        const value = this.getParameterValue(node, this.PythonName, 'name');
        if (value instanceof StringConstant) {
            return value.value;
        } else {
            return undefined;
        }
    }

    get PythonName(): TslFunction | undefined {
        return this.getFunction(CODE_GENERATION_URI, 'PythonName');
    }

    private getFunction(uri: URI, name: string): TslFunction | undefined {
        return this.getModuleMember(uri, name, isTslFunction);
    }

    /**
     * Returns the value that is assigned to the
     * parameter with the given name.
     */
    private getParameterValue(
        node: TslObject | undefined,
        funct: TslFunction | undefined,
        parameterName: string,
    ): EvaluatedNode {
        const value = funct?.parameterList?.parameters.find((param) => param.name== parameterName)
        if(!value){
            return UnknownEvaluatedNode
        }

        return this.partialEvaluator.evaluate(value);
    }
}
