// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
import {UPDATE_FILE, UPDATE_META} from './ACTIONS.js';

const HANDLERS = {
    // '111AAA': null, // A. Nirvana, everything matches
    // '111AAB': null, // B. Local changes not yet commited
    '111ABA': handleCorruptMeta,
    '111ABB': handleRemoteChanges,
    '111ABC': handleRemoteChangesWhileWorking,
    '110AA0': handleAccidentalDeletion,
    '110AB0': handleAccidentalDeletionAndCloudChanged,
    '101A0A': handlePrematureManualCreation,
    '101A0B': handlePrematureManualWrongCreation,
    '100A00': handleNewPage,
    '0110AA': handleDeleted,
    '0110AB': handlePageDeleted,
    '0100A0': handleOutdatedMeta,
    // '00100A': null, // N. Uncommited new file
    // '000000': null, // O. Void, everything is empty
};

const DESCRIPTIONS = {
    '111AAA': 'A (111AAA): Nirvana, everything matches',
    '111AAB': 'B (111AAB): Local changes not yet commited',
    '111ABA': 'C (111ABA): Corrupt meta',
    '111ABB': 'D (111ABB): Remote changes happened',
    '111ABC': 'E (111ABC): Remote changes happened while working',
    '110AA0': 'F (110AA0): Accidental deletion of a local file',
    '110AB0': 'G (110AB0): Accidental deletion of a local file and cloud changed',
    '101A0A': 'H (101A0A): Premature manual creation of a local file',
    '101A0B': 'I (101A0B): Premature manual wrong creation of a local file',
    '100A00': 'J (100A00): New page',
    '0110AA': 'K (0110AA): Page deleted',
    '0110AB': 'L (0110AB): Page deleted while working',
    '0100A0': 'M (0100A0): Outdated meta',
    '00100A': 'N (00100A): Uncommited new file',
    '000000': 'O (000000): Void, everything is empty',
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
 * C (111ABA): Corrupt meta
 */
function handleCorruptMeta(title, mergedItem) {
    return [
        {
            title,
            action: UPDATE_META,
            value: [mergedItem.cloud.sha1, mergedItem.cloud.content.length],
        },
    ];
}

/**
 * D (111ABB): Remote changes happened
 */
function handleRemoteChanges(title, mergedItem) {
    return [
        {
            title,
            action: UPDATE_META,
            value: [mergedItem.cloud.sha1, mergedItem.cloud.content.length],
        },
        {
            title,
            action: UPDATE_FILE,
            value: mergedItem.cloud.content,
        },
    ];
}

/**
 *
 */
function handleRemoteChangesWhileWorking(title, mergedItem) {
    return {};
}

/**
 *
 */
function handleAccidentalDeletion(title, mergedItem) {
    return {};
}

/**
 *
 */
function handleAccidentalDeletionAndCloudChanged(title, mergedItem) {
    return {};
}

/**
 *
 */
function handlePrematureManualCreation(title, mergedItem) {
    return {};
}

/**
 *
 */
function handlePrematureManualWrongCreation(title, mergedItem) {
    return {};
}

/**
 *
 */
function handleNewPage(title, mergedItem) {
    return {};
}

/**
 *
 */
function handleDeleted(title, mergedItem) {
    return {};
}

/**
 *
 */
function handlePageDeleted(title, mergedItem) {
    return {};
}

/**
 *
 */
function handleOutdatedMeta(title, mergedItem) {
    return {};
}
// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default triageHubs;
