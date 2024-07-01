import { AstNode, AstUtils, LangiumDocument } from 'langium';

/**
 *
 * @see isInFile
 * @see isFile
 */
export const FILE_EXTENSION = 'ttsl';

/**
 * All file extensions that are supported by the TTSL language.
 */
export const TSL_FILE_EXTENSIONS = [FILE_EXTENSION];

/**
 * All file extensions that are supported by the TTSL language.
 */
export type TslFileExtension = typeof FILE_EXTENSION;

/**
 * Returns whether the object is contained in a stub file.
 */
export const isInFile = (node: AstNode) => isFile(AstUtils.getDocument(node));

/**
 * Returns whether the resource represents a stub file.
 */
export const isFile = (document: LangiumDocument) => hasExtension(document, FILE_EXTENSION);

/**
 * Returns whether the resource represents a file with the given extension.
 */
const hasExtension = (document: LangiumDocument, extension: TslFileExtension) =>
    document.uri.path.endsWith(`.${extension}`);
