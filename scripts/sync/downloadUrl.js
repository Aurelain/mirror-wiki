import fs from 'node:fs';
import {getHeaders} from '../helpers/api.js';
import assume from '../utils/assume.js';
import computeSha1 from '../utils/computeSha1.js';

/**
 *
 */
async function downloadUrl(destinationPath, url) {
    console.log(`Downloading ${url}...`);
    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
    });
    assume(response?.ok, response, 'Unexpected fetch!');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);
    return computeSha1(buffer);
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default downloadUrl;
