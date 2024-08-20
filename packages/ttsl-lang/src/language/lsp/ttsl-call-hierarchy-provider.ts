import { type AstNode, AstUtils, type CstNode, CstUtils, type ReferenceDescription, type Stream } from 'langium';
import type {
    CallHierarchyIncomingCall,
    CallHierarchyOutgoingCall,
    Range,
    SymbolKind,
    SymbolTag,
} from 'vscode-languageserver';
import type { TTSLCallGraphComputer } from '../flow/ttsl-call-graph-computer.js';
import {
    isTslDeclaration,
    isTslParameter,
    type TslCall,
    type TslCallable,
    type TslDeclaration,
} from '../generated/ast.js';
import type { TTSLNodeMapper } from '../helpers/ttsl-node-mapper.js';
import type { TTSLServices } from '../ttsl-module.js';
import type { TTSLNodeInfoProvider } from './ttsl-node-info-provider.js';
import { AbstractCallHierarchyProvider, NodeKindProvider } from 'langium/lsp';

export class TTSLCallHierarchyProvider extends AbstractCallHierarchyProvider {
    private readonly callGraphComputer: TTSLCallGraphComputer;
    private readonly nodeInfoProvider: TTSLNodeInfoProvider;
    private readonly nodeKindProvider: NodeKindProvider;
    private readonly nodeMapper: TTSLNodeMapper;

    constructor(services: TTSLServices) {
        super(services);

        this.callGraphComputer = services.flow.CallGraphComputer;
        this.nodeInfoProvider = services.lsp.NodeInfoProvider;
        this.nodeKindProvider = services.shared.lsp.NodeKindProvider;
        this.nodeMapper = services.helpers.NodeMapper;
    }

    protected override getCallHierarchyItem(targetNode: AstNode): {
        kind: SymbolKind;
        tags?: SymbolTag[];
        detail?: string;
    } {
        return {
            kind: this.nodeKindProvider.getSymbolKind(targetNode),
            detail: this.nodeInfoProvider.getDetails(targetNode),
        };
    }

    protected getIncomingCalls(
        node: AstNode,
        references: Stream<ReferenceDescription>,
    ): CallHierarchyIncomingCall[] | undefined {
        const result: CallHierarchyIncomingCall[] = [];

        this.getUniquePotentialCallers(references).forEach((caller) => {
            if (!caller.$cstNode) {
                /* c8 ignore next 2 */
                return;
            }

            const callerNameCstNode = this.nameProvider.getNameNode(caller);
            if (!callerNameCstNode) {
                /* c8 ignore next 2 */
                return;
            }

            // Find all calls inside the caller that refer to the given node. This can also handle aliases.
            const callsOfNode = this.getCallsOf(caller, node);
            if (callsOfNode.length === 0 || callsOfNode.some((it) => !it.$cstNode)) {
                return;
            }

            const callerDocumentUri = AstUtils.getDocument(caller).uri.toString();

            result.push({
                from: {
                    name: callerNameCstNode.text,
                    range: caller.$cstNode.range,
                    selectionRange: callerNameCstNode.range,
                    uri: callerDocumentUri,
                    ...this.getCallHierarchyItem(caller),
                },
                fromRanges: callsOfNode.map((it) => it.$cstNode!.range),
            });
        });

        if (result.length === 0) {
            return undefined;
        }

        return result;
    }

    /**
     * Returns all declarations that contain at least one of the given references. Some of them might not be actual
     * callers, since the references might not occur in a call. This has to be checked later.
     */
    private getUniquePotentialCallers(references: Stream<ReferenceDescription>): Stream<TslDeclaration> {
        return references
            .map((it) => {
                const document = this.documents.getDocument(it.sourceUri);
                if (!document) {
                    /* c8 ignore next 2 */
                    return undefined;
                }

                const rootNode = document.parseResult.value;
                if (!rootNode.$cstNode) {
                    /* c8 ignore next 2 */
                    return undefined;
                }

                const targetCstNode = CstUtils.findLeafNodeAtOffset(rootNode.$cstNode, it.segment.offset);
                if (!targetCstNode) {
                    /* c8 ignore next 2 */
                    return undefined;
                }

                const containingDeclaration = AstUtils.getContainerOfType(targetCstNode.astNode, isTslDeclaration);
                if (isTslParameter(containingDeclaration)) {
                    // For parameters, we return their containing callable instead
                    return AstUtils.getContainerOfType(containingDeclaration.$container, isTslDeclaration);
                } else {
                    return containingDeclaration;
                }
            })
            .distinct()
            .filter(isTslDeclaration);
    }

    private getCallsOf(caller: AstNode, callee: AstNode): TslCall[] {
        return this.callGraphComputer
            .getAllContainedCalls(caller)
            .filter((call) => this.nodeMapper.callToCallable(call) === callee);
    }

    protected getOutgoingCalls(node: AstNode): CallHierarchyOutgoingCall[] | undefined {
        const calls = this.callGraphComputer.getAllContainedCalls(node);
        const callsGroupedByCallable = new Map<
            string,
            { callable: TslCallable; callableNameCstNode: CstNode; callableDocumentUri: string; fromRanges: Range[] }
        >();

        // Group calls by the callable they refer to
        calls.forEach((call) => {
            const callCstNode = call.$cstNode;
            if (!callCstNode) {
                /* c8 ignore next 2 */
                return;
            }

            const callable = this.nodeMapper.callToCallable(call);
            if (!callable?.$cstNode) {
                /* c8 ignore next 2 */
                return;
            }

            const callableNameCstNode = this.nameProvider.getNameNode(callable);
            if (!callableNameCstNode) {
                /* c8 ignore next 2 */
                return;
            }

            const callableDocumentUri = AstUtils.getDocument(callable).uri.toString();
            const callableId = callableDocumentUri + '~' + callableNameCstNode.text;

            const previousFromRanges = callsGroupedByCallable.get(callableId)?.fromRanges ?? [];
            callsGroupedByCallable.set(callableId, {
                callable,
                callableNameCstNode,
                fromRanges: [...previousFromRanges, callCstNode.range],
                callableDocumentUri,
            });
        });

        if (callsGroupedByCallable.size === 0) {
            return undefined;
        }

        return Array.from(callsGroupedByCallable.values()).map((call) => ({
            to: {
                name: call.callableNameCstNode.text,
                range: call.callable.$cstNode!.range,
                selectionRange: call.callableNameCstNode.range,
                uri: call.callableDocumentUri,
                ...this.getCallHierarchyItem(call.callable),
            },
            fromRanges: call.fromRanges,
        }));
    }
}
