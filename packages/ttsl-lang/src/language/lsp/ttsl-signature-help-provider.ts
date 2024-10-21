import {
    type AstNode,
    AstUtils,
    CstUtils,
    type DocumentationProvider,
    GrammarUtils,
    type LangiumDocument,
    type MaybePromise,
} from 'langium';
import type {
    CancellationToken,
    SignatureHelp,
    SignatureHelpOptions,
    SignatureHelpParams,
} from 'vscode-languageserver';
import { createMarkupContent } from '../documentation/ttsl-comment-provider.js';
import { isTslAbstractCall, isTslFunction, TslCallable, TslParameter } from '../generated/ast.js';
import { getParameters, Parameter } from '../helpers/nodeProperties.js';
import { type TTSLNodeMapper } from '../helpers/ttsl-node-mapper.js';
import type { TTSLServices } from '../ttsl-module.js';
import { type TTSLTypeComputer } from '../typing/ttsl-type-computer.js';
import { SignatureHelpProvider } from 'langium/lsp';

export class TTSLSignatureHelpProvider implements SignatureHelpProvider {
    private readonly documentationProvider: DocumentationProvider;
    private readonly nodeMapper: TTSLNodeMapper;
    private readonly typeComputer: TTSLTypeComputer;

    constructor(services: TTSLServices) {
        this.documentationProvider = services.documentation.DocumentationProvider;
        this.nodeMapper = services.helpers.NodeMapper;
        this.typeComputer = services.types.TypeComputer;
    }

    provideSignatureHelp(
        document: LangiumDocument,
        params: SignatureHelpParams,
        _cancelToken?: CancellationToken,
    ): MaybePromise<SignatureHelp | undefined> {
        const rootCstNode = document.parseResult.value.$cstNode;
        /* c8 ignore start */
        if (!rootCstNode) {
            return undefined;
        }
        /* c8 ignore stop */

        const offset = document.textDocument.offsetAt(params.position);
        const sourceCstNode = CstUtils.findLeafNodeAtOffset(rootCstNode, offset);
        /* c8 ignore start */
        if (!sourceCstNode) {
            return undefined;
        }
        /* c8 ignore stop */

        return this.getSignature(sourceCstNode.astNode, offset);
    }

    /**
     * Returns the signature help for the given node at the given offset.
     */
    private getSignature(node: AstNode, offset: number): MaybePromise<SignatureHelp | undefined> {
        const containingAbstractCall = AstUtils.getContainerOfType(node, isTslAbstractCall);
        if (!containingAbstractCall) {
            return undefined;
        }

        const callable = this.nodeMapper.callToCallable(containingAbstractCall);
        if (!callable) {
            return undefined;
        }

        const commas = GrammarUtils.findNodesForKeyword(containingAbstractCall.argumentList.$cstNode, ',');
        const activeParameter = commas.findLastIndex((comma) => comma.offset < offset) + 1;

        return {
            signatures: [
                {
                    label: this.getLabel(callable),
                    parameters: getParameters(callable).map(this.getParameterInformation),
                    documentation: createMarkupContent(this.documentationProvider.getDocumentation(callable)),
                },
            ],
            activeSignature: 0,
            activeParameter,
        };
    }

    private getLabel(callable: TslCallable): string {
        if(isTslFunction(callable)){
            const parameterTypes = callable.parameterList?.parameters.map(param =>{
                let result = param.name
                if(param.defaultValue){
                    result = result + "?"
                }
                return result + ": "+ this.typeComputer.computeType(param).toString()
            })
            const resultType = this.typeComputer.computeType(callable.result)
            return callable.name + "(" + parameterTypes + "): " + resultType
        } else{
            return "$unknown"
        }
    }

    private getParameterInformation = (parameter: TslParameter) => {
        return {
            label: this.getParameterLabel(parameter),
        };
    };

    private getParameterLabel = (parameter: TslParameter) => {
        const optionality = Parameter.isOptional(parameter) ? '?' : '';
        const type = this.typeComputer.computeType(parameter);
        return `${parameter.name}${optionality}: ${type}`;
    };

    /* c8 ignore start */
    get signatureHelpOptions(): SignatureHelpOptions {
        return {
            triggerCharacters: ['('],
            retriggerCharacters: [','],
        };
    }

    /* c8 ignore stop */
}
