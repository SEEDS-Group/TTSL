import { globSync } from 'glob';
import { URI } from 'langium';
import path from 'path';
import { fileURLToPath } from 'url';
import { TSL_FILE_EXTENSIONS } from '../language/helpers/fileExtensions.js';

let RESOURCES_PATH: string;
try {
    // For CJS (ttsl-vscode)
    RESOURCES_PATH = path.join(__dirname, '..', 'resources');
} /* c8 ignore start */ catch (e) {
    // For ESM (ttsl-cli)
    RESOURCES_PATH = fileURLToPath(new URL('../resources', import.meta.url));
} /* c8 ignore stop */

/**
 * A path relative to `src/resources/`.
 */
export type ResourceName = string;

/**
 * A path relative to `src/resources/` or a subdirectory thereof.
 */
export type ShortenedResourceName = string;

/**
 * Returns the URI that corresponds to the resource with the given name.
 *
 * @param resourceName The resource name.
 * @return The corresponding URI.
 */
export const resourceNameToUri = (resourceName: ResourceName): URI => {
    return URI.file(path.join(RESOURCES_PATH, resourceName));
};

/**
 * Returns the resource name that corresponds to the given URI. If `rootResourceName` is given, the result is relative
 * to `src/resources/<rootResourceName>`. Otherwise, the result is relative to `src/resources/`.
 *
 * @param uri The URI.
 * @param rootResourceName The corresponding root resource name.
 */
export const uriToShortenedResourceName = (uri: URI, rootResourceName?: ResourceName): ShortenedResourceName => {
    const rootPath = rootResourceName ? path.join(RESOURCES_PATH, rootResourceName) : RESOURCES_PATH;
    return path.relative(rootPath, uri.fsPath);
};

/**
 * Lists all TTSL files in the given root directory.
 *
 * @param rootResourceName The resource name of the root directory.
 * @return URIs of the discovered TTSL files.
 */
export const listTTSLFiles = (rootResourceName: ResourceName): URI[] => {
    const pattern = `**/*.{${TSL_FILE_EXTENSIONS.join(',')}}`;
    const cwd = resourceNameToUri(rootResourceName).fsPath;

    return globSync(pattern, { cwd, nodir: true }).map((it) => URI.file(path.join(cwd, it)));
};
