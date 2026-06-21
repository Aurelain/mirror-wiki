import fs from 'node:fs';
import readSettings from '../helpers/readSettings.js';
import {applySettings, ask} from '../helpers/api.js';
import assume from '../utils/assume.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
const STEP = 50;

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function purge() {
    // Settings:
    const settings = readSettings(process.argv[2]);
    applySettings(settings);

    // List:
    const jsonContent = fs.readFileSync(process.argv[3], 'utf8');
    const list = JSON.parse(jsonContent);

    // Apply:
    const {length} = list;
    for (let i = 0; i < length; i += STEP) {
        const chunk = list.slice(i, i + STEP);
        await purgePages(chunk);
    }
    console.log('Done.');
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
async function purgePages(titles) {
    const titlesString = titles.join('|');
    console.log('Purging:', titlesString);
    const purgeResponse = await ask({
        method: 'POST',
        action: 'purge',
        titles: titlesString,
        forcelinkupdate: '1',
    });
    assume(purgeResponse.batchcomplete, purgeResponse, 'Unexpected response!');
}

// =====================================================================================================================
//  R U N
// =====================================================================================================================
await purge();
