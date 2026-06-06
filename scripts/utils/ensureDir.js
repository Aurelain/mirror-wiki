import fs from 'node:fs';
import {dirname} from 'node:path';
import assume from './assume.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
function ensureDir(filePath) {
    const dir = dirname(filePath);
    try {
        fs.mkdirSync(dir, {recursive: true});
    } catch (error) {
        assume(false, error.message, filePath, 'Failed to create destination!');
    }
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default ensureDir;
