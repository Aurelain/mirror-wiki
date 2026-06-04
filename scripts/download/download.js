import fs from 'node:fs';
import {applySettings} from '../helpers/api.js';
import readSettings from '../helpers/readSettings.js';
import getChangesSince from './getChangesSince.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function download() {
    // Settings:
    const settings = readSettings(process.argv[2]);
    applySettings(settings);

    // WikiMeta:
    const dirPath = settings.DIR_PATH;
    const meta = getWikiMeta(dirPath);
    let {lastUpdate} = meta;

    // Changes:
    lastUpdate = '2026-06-04T00:00:00Z';
    await getChangesSince(lastUpdate);

    console.log('ok');
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function getWikiMeta(dirPath) {
    try {
        return JSON.parse(fs.readFileSync(dirPath + '/.wikiMeta.json', 'utf8'));
    } catch (e) {
        return {};
    }
}

// =====================================================================================================================
//  R U N
// =====================================================================================================================
await download();
