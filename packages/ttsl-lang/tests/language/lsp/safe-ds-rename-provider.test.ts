import { NodeFileSystem } from 'langium/node';
import { afterEach, describe, expect, it } from 'vitest';
import { createTTSLServices, getModuleMembers } from '../../../src/language/index.js';
import { clearDocuments } from 'langium/test';
import { TslModule } from '../../../src/language/generated/ast.js';
import { URI } from 'langium';
import { TextDocument } from 'vscode-languageserver-textdocument';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const documentBuilder = services.shared.workspace.DocumentBuilder;
const langiumDocuments = services.shared.workspace.LangiumDocuments;
const langiumDocumentFactory = services.shared.workspace.LangiumDocumentFactory;
const nameProvider = services.references.NameProvider;
const renameProvider = services.lsp.RenameProvider!;

const resourceUri = 'file:///resource.Tslstub';
const mainUri = 'file:///main.Tslpipe';

describe.skip('TTSLRenameProvider', async () => {
    const testCases: RenameProviderTest[] = [
        {
            testName: 'local reference',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        function MyFunction() {}

                        function f(p: MyClass)
                    `,
                    expectedOutput: `
                        package test

                        function SomeFunction() {}

                        function f(p: SomeFunction)
                    `,
                },
            ],
        },
        {
            testName: 'implicit import',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        class MyClass
                    `,
                    expectedOutput: `
                        package test

                        class SomeClass
                    `,
                },
                {
                    uri: mainUri,
                    originalContent: `
                        package test

                        function f(p: MyClass)
                    `,
                    expectedOutput: `
                        package test

                        function f(p: SomeClass)
                    `,
                },
            ],
        },
        {
            testName: 'explicit import (wildcard)',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        class MyClass
                    `,
                    expectedOutput: `
                        package test

                        class SomeClass
                    `,
                },
                {
                    uri: mainUri,
                    originalContent: `
                        package test2

                        from test import *

                        function f(p: MyClass)
                    `,
                    expectedOutput: `
                        package test2

                        from test import *

                        function f(p: SomeClass)
                    `,
                },
            ],
        },
        {
            testName: 'explicit import (qualified, no alias)',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        class MyClass
                    `,
                    expectedOutput: `
                        package test

                        class SomeClass
                    `,
                },
                {
                    uri: mainUri,
                    originalContent: `
                        package test2

                        from test import MyClass

                        function f(p: MyClass)
                    `,
                    expectedOutput: `
                        package test2

                        from test import SomeClass

                        function f(p: SomeClass)
                    `,
                },
            ],
        },
        {
            testName: 'explicit import (qualified, alias, different name)',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        class MyClass
                    `,
                    expectedOutput: `
                        package test

                        class SomeClass
                    `,
                },
                {
                    uri: mainUri,
                    originalContent: `
                        package test2

                        from test import MyClass as MyClass2

                        function f(p: MyClass2)
                    `,
                    expectedOutput: `
                        package test2

                        from test import SomeClass as MyClass2

                        function f(p: MyClass2)
                    `,
                },
            ],
        },
        {
            testName: 'explicit import (qualified, alias, same name)',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        class MyClass
                    `,
                    expectedOutput: `
                        package test

                        class SomeClass
                    `,
                },
                {
                    uri: mainUri,
                    originalContent: `
                        package test2

                        from test import MyClass as MyClass

                        function f(p: MyClass)
                    `,
                    expectedOutput: `
                        package test2

                        from test import SomeClass as MyClass

                        function f(p: MyClass)
                    `,
                },
            ],
        },
        {
            testName: 'implicit + explicit import',
            descriptions: [
                {
                    uri: resourceUri,
                    originalContent: `
                        package test

                        class MyClass
                    `,
                    expectedOutput: `
                        package test

                        class SomeClass
                    `,
                },
                {
                    uri: mainUri,
                    originalContent: `
                        package test

                        from test import MyClass as MyClass2

                        function f(p: MyClass)
                    `,
                    expectedOutput: `
                        package test

                        from test import SomeClass as MyClass2

                        function f(p: SomeClass)
                    `,
                },
            ],
        },
    ];

    afterEach(() => {
        clearDocuments(services);
    });

    it.each(testCases)('$testName', async ({ descriptions }) => {
        if (descriptions.length === 0) {
            throw new Error('No documents to rename.');
        }

        // Add documents to workspace
        const documents = descriptions.map((description) => {
            const document = langiumDocumentFactory.fromString(description.originalContent, URI.parse(description.uri));
            langiumDocuments.addDocument(document);
            return document;
        });
        await documentBuilder.build(documents);

        // Get the element to rename
        const firstDocument = documents[0]!;
        const firstModule = firstDocument.parseResult.value as TslModule;
        const firstMember = getModuleMembers(firstModule)[0];
        if (!firstMember) {
            throw new Error('No member to rename.');
        }

        // Rename the element
        const position = nameProvider.getNameNode(firstMember)!.range.start;
        const changes =
            (
                await renameProvider.rename(firstDocument, {
                    textDocument: { uri: firstDocument.uri.toString() },
                    position,
                    newName: 'SomeFunction',
                })
            )?.changes ?? {};

        // Check the results
        for (const description of descriptions) {
            const document = langiumDocuments.getDocument(URI.parse(description.uri))!;
            const edits = changes[description.uri] ?? [];
            const actualOutput = TextDocument.applyEdits(document.textDocument, edits);

            expect(actualOutput).toStrictEqual(description.expectedOutput);
        }
    });
});

/**
 * A description of a test case for the rename provider. We rename the first member of the first document.
 */
interface RenameProviderTest {
    /**
     * A short description of the test case.
     */
    testName: string;

    /**
     * The documents to rename.
     */
    descriptions: DocumentDescription[];
}

/**
 * A document with a URI and content.
 */
interface DocumentDescription {
    /**
     * The URI of the document.
     */
    uri: string;

    /**
     * The original content of the document.
     */
    originalContent: string;

    /**
     * The expected content of the document after renaming.
     */
    expectedOutput: string;
}
