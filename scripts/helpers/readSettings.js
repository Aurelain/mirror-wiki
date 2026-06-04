import fs from 'node:fs';
import assume from '../utils/assume.js';
import {join} from 'node:path';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
function readSettings(jsonPath) {
    assume(fs.existsSync(jsonPath), 'Invalid json path!', jsonPath);
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const json = JSON.parse(jsonContent);

    // Check the working directory:
    assume(json.DIR_PATH, 'No DIR_PATH in settings!');
    const dirPath = join(jsonPath, '/../', json.DIR_PATH);
    assume(fs.statSync(dirPath).isDirectory(), 'Not a directory!', dirPath);
    json.DIR_PATH = dirPath;

    return json;
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default readSettings;
