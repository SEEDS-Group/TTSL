import { URI } from 'langium';
import { listTTSLFiles } from '../../helpers/resources.js';

/**
 * Lists all TTSL files in `src/resources/builtins`.
 *
 * @return URIs of all discovered files.
 */
export const listBuiltinFiles = (): URI[] => {
    return listTTSLFiles('builtins');
};
