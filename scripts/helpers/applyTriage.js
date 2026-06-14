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
import assume from '../utils/assume.js';
import convertTitleToPath from './convertTitleToPath.js';
import writeFile from '../utils/writeFile.js';
import downloadUrl from '../sync/downloadUrl.js';
import getCsrfToken from './getCsrfToken.js';
import uploadPage from './uploadPage.js';
import computeSha1 from '../utils/computeSha1.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
let csrfToken;

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function applyTriage(operations, metaHub, dirPath, auth, comment) {
    const {length} = operations;
    for (let i = 0; i < length; i++) {
        if (!auth) {
            await applyDownload(operations[i], metaHub, dirPath, operations[i]);
        } else {
            await applyUpload(operations[i], auth, metaHub, comment);
        }
    }
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
async function applyDownload({title, action, value}, metaHub, dirPath, nextOperation) {
    switch (action) {
        case CREATE_META: // fall
        case UPDATE_META:
            metaHub[title] = metaHub[title] || {};
            metaHub[title].sha1 = value;
            break;
        case DELETE_META:
            delete metaHub[title];
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
                    mutateNextOperation(nextOperation, sha1);
                } else {
                    writeFile(filePath, value);
                }
            }
            break;
        case CREATE_PAGE: // fall
        case UPDATE_PAGE:
            // See `applyUpload()`
            break;
        default:
            assume(false, action, 'Unexpected action!');
            break;
    }
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

/**
 *
 */
async function applyUpload({title, action, value}, auth, metaHub, comment) {
    if (action === CREATE_PAGE || action === UPDATE_PAGE) {
        csrfToken = csrfToken || (await getCsrfToken(auth.username, auth.password));
        await uploadPage(title, value, csrfToken, comment);
        metaHub[title] = metaHub[title] || {};
        metaHub[title].sha1 = computeSha1(value);
    }
}
// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default applyTriage;
