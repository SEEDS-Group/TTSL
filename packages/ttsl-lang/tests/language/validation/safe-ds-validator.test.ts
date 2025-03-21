import { AssertionError } from 'assert';
import { NodeFileSystem } from 'langium/node';
import { isRangeEqual } from 'langium/test';
import { describe, it } from 'vitest';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { locationToString } from '../../../src/helpers/locations.js';
import { loadDocuments } from '../../helpers/testResources.js';
import { createValidationTests, ExpectedIssue } from './creator.js';
import { createTTSLServices } from '../../../src/language/index.js';

const services = (await createTTSLServices(NodeFileSystem)).TTSL;
const langiumDocuments = services.shared.workspace.LangiumDocuments;

describe('validation', async () => {
    it.each(await createValidationTests())('$testName', async (test) => {
        // Test is invalid
        if (test.error) {
            throw test.error;
        }

        // Load all documents
        await loadDocuments(services, test.uris, { validation: true });

        // Ensure all expected issues match
        for (const expectedIssue of test.expectedIssues) {
            const actualIssues = getMatchingActualIssues(expectedIssue);

            // Expected to find a matching issue
            if (expectedIssue.presence === 'present') {
                if (actualIssues.length === 0) {
                    throw new AssertionError({
                        message: `Expected to find a matching ${expectedIssue.severity} ${issueLocationToString(
                            expectedIssue,
                        )} but found none.`,
                        actual: getMatchingActualIssues({
                            presence: expectedIssue.presence,
                            severity: expectedIssue.severity,
                            uri: expectedIssue.uri,
                        }),
                        expected: [expectedIssue],
                    });
                }
            }

            // Expected to find no matching issue
            else {
                if (actualIssues.length > 0) {
                    throw new AssertionError({
                        message: `Expected to find no matching ${expectedIssue.severity} ${issueLocationToString(
                            expectedIssue,
                        )} but found some.`,
                        actual: actualIssues,
                        expected: [],
                    });
                }
            }
        }
    });
});

/**
 * Find the actual issues matching the expected issues.
 *
 * @param expectedIssue The expected issue.
 */
const getMatchingActualIssues = (expectedIssue: ExpectedIssue): Diagnostic[] => {
    const document = langiumDocuments.getDocument(expectedIssue.uri);
    let result = document?.diagnostics ?? [];

    // Filter by severity
    switch (expectedIssue.severity) {
        case 'error':
            result = result.filter((d) => d.severity === DiagnosticSeverity.Error);
            break;
        case 'warning':
            result = result.filter((d) => d.severity === DiagnosticSeverity.Warning);
            break;
        case 'info':
            result = result.filter((d) => d.severity === DiagnosticSeverity.Information);
            break;
        case 'hint':
            result = result.filter((d) => d.severity === DiagnosticSeverity.Hint);
            break;
    }

    // Filter by message
    if (expectedIssue.message) {
        if (expectedIssue.messageIsRegex) {
            const regex = new RegExp(expectedIssue.message, 'u');
            result = result.filter((d) => regex.test(d.message));
        } else {
            result = result.filter((d) => d.message === expectedIssue.message);
        }
    }

    // Filter by range
    if (expectedIssue.range) {
        result = result.filter((d) => isRangeEqual(d.range, expectedIssue.range!));
    }

    return result;
};

/**
 * Converts the location of an expected issue to a string.
 *
 * @param expectedIssue The issue.
 */
const issueLocationToString = (expectedIssue: ExpectedIssue): string => {
    if (expectedIssue.range) {
        return `at ${locationToString({ uri: expectedIssue.uri.toString(), range: expectedIssue.range })}`;
    } else {
        return `in ${expectedIssue.uri}`;
    }
};
