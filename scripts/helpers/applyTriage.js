import {
    CREATE_FILE,
    CREATE_META,
    CREATE_PAGE,
    DELETE_FILE,
    DELETE_META,
    UPDATE_FILE,
    UPDATE_META,
    UPDATE_PAGE,
} from './ACTIONS.js';
import fs from 'node:fs';
import writeMeta from './writeMeta.js';
import assume from '../utils/assume.js';
import convertTitleToPath from './convertTitleToPath.js';
import writeFile from '../utils/writeFile.js';
import downloadUrl from '../sync/downloadUrl.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function applyTriage(operations, metaHub, dirPath) {
    const metaPages = simplifyHub(metaHub);
    const {length} = operations;
    for (let i = 0; i < length; i++) {
        const {title, action, value} = operations[i];
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
                    if (title.endsWith('.url')) {
                        const sha1 = await downloadUrl(filePath, value);
                        mutateNextOperation(operations[i + 1], sha1);
                    } else {
                        writeFile(filePath, value);
                    }
                }
                break;
            case CREATE_PAGE: // fall
            case UPDATE_PAGE:
                console.log('TODO', action);
                break;
            default:
                assume(false, action, 'Unexpected action!');
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

/**
 * Hack to store both the cloud and local hashes inside the meta, because the cloud sha is unreliable.
 */
function mutateNextOperation(operation, localFileSha1) {
    if (operation) {
        const {action} = operation;
        if (action === CREATE_META || action === UPDATE_META) {
            operation.value += localFileSha1;
        }
    }
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default applyTriage;
