import fs from 'node:fs';
import {join} from 'node:path';
import assume from '../utils/assume.js';
import {applySettings} from '../helpers/api.js';
import getCsrfToken from '../helpers/getCsrfToken.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function download() {
    // Settings:
    const jsonPath = process.argv[2];
    const settings = readSettings(jsonPath);
    assume(settings, 'No settings found!');
    adaptSettings(settings, jsonPath);
    applySettings(settings);

    // Csrf:
    const csrf = await getCsrfToken(settings.USERNAME, settings.PASSWORD);
    console.log('csrf:', csrf);

    console.log('ok');
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

/**
 *
 */
function adaptSettings(settings, jsonPath) {
    assume(settings.DIR_PATH, 'No DIR_PATH in settings!');
    const dirPath = join(jsonPath, '/../', settings.DIR_PATH);
    assume(fs.statSync(dirPath).isDirectory(), 'Not a directory!', dirPath);
    settings.DIR_PATH = dirPath;
}
// =====================================================================================================================
//  R U N
// =====================================================================================================================
await download();
