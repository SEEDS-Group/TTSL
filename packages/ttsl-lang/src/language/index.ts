import { pipVersionRange } from './runtime/ttsl-python-server.js';

// Services
export type { TTSLServices } from './ttsl-module.js';
export { createTTSLServices } from './ttsl-module.js';

// Language Server
export { startLanguageServer } from './main.js';

// Language Metadata
export { TTSLLanguageMetaData } from './generated/module.js';

// AST
export * as ast from './generated/ast.js';
export * from './helpers/nodeProperties.js';

// Location
export { locationToString, positionToString, rangeToString } from '../helpers/locations.js';

// RPC
export * as rpc from './communication/rpc.js';

export const dependencies = {
    'ttsl-runner': {
        pipVersionRange,
    },
};