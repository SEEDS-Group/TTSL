import { AssertionError } from 'assert';
import { AstNode, AstUtils, DocumentValidator, LangiumDocument, Reference, URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { clearDocuments, isRangeEqual, validationHelper } from 'langium/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Location } from 'vscode-languageserver';
import { createTTSLServices } from '../../../src/language/index.js';
import { isLocationEqual, locationToString } from '../../../src/helpers/locations.js';
import { loadDocuments } from '../../helpers/testResources.js';
import { createScopingTests, ExpectedReference } from './creator.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const langiumDocuments = services.shared.workspace.LangiumDocuments;

describe('scoping', async () => {
    beforeEach(async () => {
        // Load the builtin library
        await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
    });

    afterEach(async () => {
        await clearDocuments(services);
    });

    it.each(await createScopingTests())('$testName', async (test) => {
        // Test is invalid
        if (test.error) {
            throw test.error;
        }

        // Load all documents
        await loadDocuments(services, test.uris);

        // Ensure all expected references match
        for (const expectedReference of test.expectedReferences) {
            const expectedTargetLocation = expectedReference.targetLocation;
            const actualTargetLocation = findActualTargetLocation(expectedReference);

            // Expected reference to be resolved
            if (expectedTargetLocation) {
                if (!actualTargetLocation) {
                    throw new AssertionError({
                        message: `Expected a resolved reference but it was unresolved.\n    Reference Location: ${locationToString(
                            expectedReference.location,
                        )}\n    Expected Target Location: ${locationToString(expectedTargetLocation)}`,
                    });
                } else if (!isLocationEqual(expectedTargetLocation, actualTargetLocation)) {
                    throw new AssertionError({
                        message: `Expected a resolved reference but it points to the wrong declaration.\n    Reference Location: ${locationToString(
                            expectedReference.location,
                        )}\n    Expected Target Location: ${locationToString(
                            expectedTargetLocation,
                        )}\n    Actual Target Location: ${locationToString(actualTargetLocation)}`,
                        expected: expectedTargetLocation,
                        actual: actualTargetLocation,
                    });
                }
            }

            // Expected reference to be unresolved
            else {
                if (actualTargetLocation) {
                    throw new AssertionError({
                        message: `Expected an unresolved reference but it was resolved.\n    Reference Location: ${locationToString(
                            expectedReference.location,
                        )}\n    Actual Target Location: ${locationToString(actualTargetLocation)}`,
                    });
                }
            }
        }
    });

    it('should resolve members on literal types', async () => {
        const code = `
            function MyFunction(p: String) {
                p.toString();
            }
        `;
        await expectNoLinkingErrors(code);
    });
});

/**
 * Find the actual target location of the actual reference that matches the expected reference. If the actual reference
 * cannot be resolved, undefined is returned.
 *
 * @param expectedReference The expected reference.
 * @returns The actual target location or undefined if the actual reference is not resolved.
 * @throws AssertionError If no matching actual reference was found.
 */
const findActualTargetLocation = (expectedReference: ExpectedReference): Location | undefined => {
    const document = langiumDocuments.getDocument(URI.parse(expectedReference.location.uri))!;

    const actualReference = findActualReference(document, expectedReference);

    const actualTarget = actualReference.$nodeDescription;
    const actualTargetUri = actualTarget?.documentUri?.toString();
    const actualTargetRange = actualTarget?.nameSegment?.range;

    if (!actualTargetUri || !actualTargetRange) {
        return undefined;
    }

    return {
        uri: actualTargetUri,
        range: actualTargetRange,
    };
};

/**
 * Find the reference in the given document that matches the expected reference.
 *
 * @param document The document to search in.
 * @param expectedReference The expected reference.
 * @returns The actual reference.
 * @throws AssertionError If no reference was found.
 */
const findActualReference = (document: LangiumDocument, expectedReference: ExpectedReference): Reference => {
    // Find actual reference
    const actualReference = document.references.find((reference) => {
        const actualReferenceRange = reference.$refNode?.range;
        return actualReferenceRange && isRangeEqual(actualReferenceRange, expectedReference.location.range);
    });

    // Could not find a reference at the expected location
    if (!actualReference) {
        throw new AssertionError({
            message: `Expected a reference but found none.\n    Reference Location: ${locationToString(
                expectedReference.location,
            )}`,
        });
    }
    return actualReference;
};

/**
 * The given code should have no linking errors or an `AssertionError` is thrown.
 */
const expectNoLinkingErrors = async (code: string) => {
    const { diagnostics } = await validationHelper(services)(code);
    const linkingError = diagnostics.filter((d) => d.data?.code === DocumentValidator.LinkingError);
    expect(linkingError).toStrictEqual([]);
};
