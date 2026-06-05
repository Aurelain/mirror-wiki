// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
import {
    DELETE_META,
    DELETE_FILE,
    CREATE_META,
    CREATE_FILE,
    UPDATE_FILE,
    CREATE_PAGE,
    UPDATE_META,
    UPDATE_PAGE,
} from './ACTIONS.js';

const HANDLERS = {
    // '111AAA': null, // A. Nirvana, everything matches
    '111AAB': handleLocalChangesNotCommited,
    '111ABA': handleCorruptMeta,
    '111ABB': handleRemoteChanges,
    '111ABC': handleRemoteChangesWhileWorking,
    '110AA0': handleAccidentalDeletion,
    '110AB0': handleAccidentalDeletionAndCloudChanged,
    '101A0A': handlePrematureManualCreation,
    '101A0B': handlePrematureManualWrongCreation,
    '100A00': handleNewPage,
    '0110AA': handlePageDeleted,
    '0110AB': handlePageDeletedWhileWorking,
    '0100A0': handleOutdatedMeta,
    '00100A': handleUncommitedNewFile,
    // '000000': null, // O. Void, everything is empty
};

const DESCRIPTIONS = {
    '111AAA': 'Nirvana, everything matches (111AAA)',
    '111AAB': 'Local changes not yet commited (111AAB)',
    '111ABA': 'Corrupt meta (111ABA)',
    '111ABB': 'Remote changes happened (111ABB)',
    '111ABC': 'Remote changes happened while working (111ABC)',
    '110AA0': 'Accidental deletion of a local file (110AA0)',
    '110AB0': 'Accidental deletion of a local file and cloud changed (110AB0)',
    '101A0A': 'Premature manual creation of a local file (101A0A)',
    '101A0B': 'Premature manual wrong creation of a local file (101A0B)',
    '100A00': 'New page (100A00)',
    '0110AA': 'Page deleted (0110AA)',
    '0110AB': 'Page deleted while working (0110AB)',
    '0100A0': 'Outdated meta (0100A0)',
    '00100A': 'Uncommited new file (00100A)',
    '000000': 'Void, everything is empty (000000)',
};

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *             Cloud  Meta  Local  Cloud*  Meta*  Local*  Description
 *  Case A    1      1     1      A       A      A       Nirvana, everything matches
 *  Case B    1      1     1      A       A      B       Local changes not yet commited
 *  Case C    1      1     1      A       B      A       Corrupt meta
 *  Case D    1      1     1      A       B      B       Remote changes happened
 *  Case E    1      1     1      A       B      C       Remote changes happened while working
 *  Case F    1      1     0      A       A      0       Accidental deletion of a local file
 *  Case G    1      1     0      A       B      0       Accidental deletion of a local file and cloud changed
 *  Case H    1      0     1      A       0      A       Premature manual creation of a local file
 *  Case I    1      0     1      A       0      B       Premature manual wrong creation of a local file
 *  Case J    1      0     0      A       0      0       New page
 *  Case K    0      1     1      0       A      A       Page deleted
 *  Case L    0      1     1      0       A      B       Page deleted while working
 *  Case M    0      1     0      0       A      0       Outdated meta
 *  Case N    0      0     1      0       0      A       Uncommited new file
 *  Case O    0      0     0      0       0      0       Void, everything is empty
 */
function triageHubs(cloudHub, metaHub, localHub) {
    const hub = mergeHubs(cloudHub, metaHub, localHub);
    if (Object.keys(hub).length === 0) {
        return null;
    }
    const tally = {};
    const operations = [];
    for (const title in hub) {
        const {code} = hub[title];
        const description = DESCRIPTIONS[code];
        tally[description] = tally[description] || 0;
        tally[description]++;
        const handler = HANDLERS[code];
        if (handler) {
            operations.push(...handler(title, hub[title]));
        }
    }
    return {tally, operations};
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function mergeHubs(cloudHub, metaHub, localHub) {
    const hub = {};
    for (const title in cloudHub) {
        const entryC = cloudHub[title];
        const entryM = metaHub[title];
        const entryL = localHub[title];
        const titleC = 1;
        const titleM = entryM ? 1 : 0;
        const titleL = entryL ? 1 : 0;
        const dataC = 'A';
        const dataM = titleM ? (entryC.sha1 === entryM.sha1 ? 'A' : 'B') : 0;
        const dataL = titleL ? decideLocalCode(entryC, entryM, entryL) : 0;
        hub[title] = generate(titleC, titleM, titleL, dataC, dataM, dataL, entryC, entryM, entryL);
    }
    for (const title in metaHub) {
        if (!cloudHub[title]) {
            const entryM = metaHub[title];
            const entryL = localHub[title];
            const titleC = 0;
            const titleM = 1;
            const titleL = localHub[title] ? 1 : 0;
            const dataC = 0;
            const dataM = 'A';
            const dataL = localHub[title] ? (entryM.sha1 === entryL.sha1 ? 'A' : 'B') : 0;
            hub[title] = generate(titleC, titleM, titleL, dataC, dataM, dataL, null, entryM, entryL);
        }
    }
    for (const title in localHub) {
        if (!cloudHub[title] && !metaHub[title]) {
            hub[title] = generate(0, 0, 1, 0, 0, 'A', null, null, localHub[title]);
        }
    }
    return hub;
}

/**
 *
 */
function decideLocalCode(cloudEntry, metaEntry, localEntry) {
    if (metaEntry) {
        if (localEntry) {
            if (cloudEntry.sha1 === metaEntry.sha1) {
                return metaEntry.sha1 === localEntry.sha1 ? 'A' : 'B';
            } else {
                if (cloudEntry.sha1 === localEntry.sha1) {
                    return 'A';
                } else {
                    return metaEntry.sha1 === localEntry.sha1 ? 'B' : 'C';
                }
            }
        } else {
            return 0;
        }
    } else {
        if (localEntry) {
            return cloudEntry.sha1 === localEntry.sha1 ? 'A' : 'B';
        } else {
            return 0;
        }
    }
}

/**
 *
 */
function generate(titleC, titleM, titleL, dataC, dataM, dataL, entryC, entryM, entryL) {
    return {
        code: [titleC, titleM, titleL, dataC, dataM, dataL].join(''),
        cloud: entryC,
        meta: entryM,
        local: entryL,
    };
}

/**
 *
 */
function summarizeChanges(old = '', fresh = '') {
    const delta = fresh.length - old.length;
    if (delta === 0) {
        return '~0';
    } else {
        if (delta < 0) {
            return delta.toString();
        } else {
            return '+' + delta;
        }
    }
}

/**
 * Local changes not yet commited (111AAB)
 */
function handleLocalChangesNotCommited(title, item) {
    return [
        {
            title,
            action: UPDATE_PAGE,
            value: item.local.content,
            brief: summarizeChanges(item.cloud.content, item.local.content),
        },
    ];
}

/**
 * Corrupt meta (111ABA)
 */
function handleCorruptMeta(title, item) {
    return [
        {
            title,
            action: UPDATE_META,
            value: item.cloud.sha1,
        },
    ];
}

/**
 * Remote changes happened (111ABB)
 */
function handleRemoteChanges(title, item) {
    return [
        {
            title,
            action: UPDATE_META,
            value: item.cloud.sha1,
        },
        {
            title,
            action: UPDATE_FILE,
            value: item.cloud.content,
            brief: summarizeChanges(item.local.content, item.cloud.content),
        },
    ];
}

/**
 * Remote changes happened while working (111ABC)
 */
function handleRemoteChangesWhileWorking(title, item) {
    return [
        {
            title,
            action: UPDATE_META,
            value: item.cloud.sha1,
        },
        {
            title,
            action: UPDATE_FILE,
            value: item.cloud.content,
            guard: true,
            brief: summarizeChanges(item.local.content, item.cloud.content),
        },
    ];
}

/**
 * Accidental deletion of a local file (110AA0)
 */
function handleAccidentalDeletion(title, item) {
    return [
        {
            title,
            action: CREATE_FILE,
            value: item.cloud.content,
            brief: summarizeChanges('', item.cloud.content),
        },
    ];
}

/**
 * Accidental deletion of a local file and cloud changed (110AB0)
 */
function handleAccidentalDeletionAndCloudChanged(title, item) {
    return [
        {
            title,
            action: UPDATE_META,
            value: item.cloud.sha1,
        },
        {
            title,
            action: CREATE_FILE,
            value: item.cloud.content,
            brief: summarizeChanges('', item.cloud.content),
        },
    ];
}

/**
 * Premature manual creation of a local file (101A0A)
 */
function handlePrematureManualCreation(title, item) {
    return [
        {
            title,
            action: CREATE_META,
            value: item.cloud.sha1,
        },
    ];
}

/**
 * Premature manual wrong creation of a local file (101A0B)
 */
function handlePrematureManualWrongCreation(title, item) {
    return [
        {
            title,
            action: CREATE_META,
            value: item.cloud.sha1,
        },
        {
            title,
            action: UPDATE_FILE,
            value: item.cloud.content,
            guard: true,
            brief: summarizeChanges(item.local.content, item.cloud.content),
        },
    ];
}

/**
 * New page (100A00)
 */
function handleNewPage(title, item) {
    return [
        {
            title,
            action: CREATE_META,
            value: item.cloud.sha1,
        },
        {
            title,
            action: CREATE_FILE,
            value: item.cloud.content,
            brief: summarizeChanges('', item.cloud.content),
        },
    ];
}

/**
 * Page deleted (0110AA)
 */
function handlePageDeleted(title, item) {
    return [
        {
            title,
            action: DELETE_META,
        },
        {
            title,
            action: DELETE_FILE,
            brief: summarizeChanges(item.local.content, ''),
        },
    ];
}

/**
 * Page deleted while working (0110AB)
 */
function handlePageDeletedWhileWorking(title, item) {
    return [
        {
            title,
            action: DELETE_META,
        },
        {
            title,
            action: DELETE_FILE,
            guard: true,
            brief: summarizeChanges(item.local.content, ''),
        },
    ];
}

/**
 * Outdated meta (0100A0)
 */
function handleOutdatedMeta(title) {
    return [
        {
            title,
            action: DELETE_META,
        },
    ];
}

/**
 * Uncommited new file (00100A)
 */
function handleUncommitedNewFile(title, item) {
    return [
        {
            title,
            action: CREATE_PAGE,
            value: item.local.content,
            brief: summarizeChanges('', item.local.content),
        },
    ];
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default triageHubs;
