import fs from 'node:fs';
import assume from './assume.js';
import ensureDir from './ensureDir.js';

/**
 *
 */
function writeFile(filePath, content) {
    ensureDir(filePath);
    try {
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        assume(false, error.message, filePath, 'Failed to write file!');
    }
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default writeFile;
