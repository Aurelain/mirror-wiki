import fs from 'node:fs';
import {WIKI_META_FILE_NAME} from './SETTINGS.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
function writeMeta(dirPath, pages) {
    const filePath = dirPath + '/' + WIKI_META_FILE_NAME;
    const json = {
        lastUpdate: new Date().toISOString(),
        pages,
    };
    const text = JSON.stringify(json, null, 4);
    fs.writeFileSync(filePath, text);
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default writeMeta;
