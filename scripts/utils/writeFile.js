import fs from 'node:fs';
import {dirname} from 'node:path';
import assume from './assume.js';

/**
 *
 */
function writeFile(filePath, content) {
    try {
        const dir = dirname(filePath);
        fs.mkdirSync(dir, {recursive: true});
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        assume(false, error.message, filePath, 'Failed to write file!');
    }
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default writeFile;
