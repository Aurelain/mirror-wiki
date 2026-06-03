import fs from 'node:fs';
import assume from '../utils/assume.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function download() {
    const jsonPath = process.argv[2];
    const settings = readSettings(jsonPath);
    assume(settings, 'No settings found!');
    console.log(settings);
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function readSettings(jsonPath) {
    assume(fs.existsSync(jsonPath), 'Invalid json path!', jsonPath);
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    try {
        return JSON.parse(jsonContent);
    } catch (err) {
        console.error(err.message);
    }
}
// =====================================================================================================================
//  R U N
// =====================================================================================================================
await download();
