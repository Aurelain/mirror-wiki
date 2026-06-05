import {CREATE_FILE, CREATE_META, DELETE_FILE, DELETE_META, UPDATE_FILE, UPDATE_META} from './ACTIONS.js';
import fs from 'node:fs';
import writeMeta from './writeMeta.js';
import assume from '../utils/assume.js';
import convertTitleToPath from './convertTitleToPath.js';
import writeFile from '../utils/writeFile.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function applyTriage(operations, metaHub, dirPath) {
    const metaPages = simplifyHub(metaHub);
    for (const operation of operations) {
        const {title, action, value} = operation;
        switch (action) {
            case CREATE_META: // fall
            case UPDATE_META:
                metaPages[title] = value;
                break;
            case DELETE_META:
                delete metaPages[title];
                break;
            case CREATE_FILE: // fall
            case UPDATE_FILE: // fall
            case DELETE_FILE:
                const filePath = dirPath + '/' + convertTitleToPath(title);
                if (action === DELETE_FILE) {
                    fs.unlinkSync(filePath);
                    assume(!fs.existsSync(filePath), filePath, 'Deletion failed!');
                } else {
                    writeFile(filePath, value);
                }
                break;
            default:
                // We're skipping CREATE_PAGE and UPDATE_PAGE at this stage
                break;
        }
    }
    writeMeta(dirPath, metaPages);
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function simplifyHub(metaHub) {
    const hub = {};
    for (const title in metaHub) {
        hub[title] = metaHub[title].sha1;
    }
    return hub;
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default applyTriage;
