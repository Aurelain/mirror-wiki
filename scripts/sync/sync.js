import fs from 'node:fs';
import {join} from 'node:path';
import {applySettings} from '../helpers/api.js';
import readSettings from '../helpers/readSettings.js';
import getChangesSince from './getChangesSince.js';
import computeSha1 from '../utils/computeSha1.js';
import convertPathToTitle from '../helpers/convertPathToTitle.js';
import readMeta from '../helpers/readMeta.js';
import triageHubs from '../helpers/triageHubs.js';
import confirm from '../utils/confirm.js';
import applyTriage from '../helpers/applyTriage.js';
import healTriage from './healTriage.js';
import sortJson from '../utils/sortJson.js';
import {CREATE_PAGE, UPDATE_PAGE} from '../helpers/ACTIONS.js';
import writeMeta from '../helpers/writeMeta.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
const UPLOAD = new Set([CREATE_PAGE, UPDATE_PAGE]);

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function sync() {
    // Settings:
    const settings = readSettings(process.argv[2]);
    applySettings(settings);

    // Meta:
    const dirPath = settings.DIR_PATH;
    const meta = readMeta(dirPath);
    const lastUpdate = meta.lastUpdate;
    const metaHub = buildMetaHub(meta);

    // Cloud:
    const pages = await getChangesSince(lastUpdate);
    const changesHub = buildChangesHub(pages);
    const cloudHub = lastUpdate ? {...metaHub, ...changesHub} : changesHub;

    // Local:
    const localHub = buildLocalHub(dirPath, dirPath.length + 1);

    // Triage:
    const triageResult = triageHubs(cloudHub, metaHub, localHub);
    if (!triageResult) {
        return console.log('Everything is empty...');
    }
    await healTriage(triageResult); // account for missing values
    announceTally(triageResult);

    // Danger:
    if (triageResult.operations.length) {
        await confirmOperations(triageResult.operations);
        await applyTriage(triageResult.operations, metaHub, dirPath);
        if (process.argv[3] === 'upload') {
            const comment = await confirmOperations(triageResult.operations, true);
            const auth = {username: settings.USERNAME, password: settings.PASSWORD};
            await applyTriage(triageResult.operations, metaHub, dirPath, auth, comment);
        }
        writeMeta(dirPath, simplifyHub(metaHub));
    }

    // Output:
    console.log('Done.');
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function buildMetaHub(meta) {
    const hub = {};
    for (const title in meta.pages) {
        hub[title] = {
            sha1: meta.pages[title],
        };
    }
    return hub;
}

/**
 *
 */
function buildChangesHub(pages) {
    const hub = {};
    for (const page of pages) {
        const {title, revisions, ns, imageinfo} = page;
        const content = revisions[0]['slots'].main.content;
        hub[title] = {
            content,
            sha1: computeSha1(content),
        };
        if (ns === 6 && imageinfo) {
            // File:
            const content = imageinfo[0].url;
            const sha1 = imageinfo[0].sha1;
            hub[title + '.url'] = {
                content,
                sha1,
            };
        }
    }
    return hub;
}

/**
 *
 */
function buildLocalHub(dirPath, rootPathLength, hub = {}) {
    const list = fs.readdirSync(dirPath);
    for (const file of list) {
        if (file.startsWith('.')) {
            continue; // skip hidden files (e.g. .wiki-meta.json)
        }
        const joinedPath = join(dirPath, file);
        const stat = fs.statSync(joinedPath);
        if (stat && stat.isDirectory()) {
            buildLocalHub(joinedPath, rootPathLength, hub);
        } else {
            const title = convertPathToTitle(joinedPath.substring(rootPathLength));
            if (joinedPath.includes('/File/') && !file.endsWith('.wiki')) {
                // Binary
                hub[title] = {
                    content: joinedPath,
                    sha1: computeSha1(fs.readFileSync(joinedPath)),
                };
            } else {
                // Normal text file
                const content = fs.readFileSync(joinedPath, 'utf8');
                hub[title] = {
                    content,
                    sha1: computeSha1(content),
                };
            }
        }
    }
    return hub;
}

/**
 *
 */
function announceTally({tally}) {
    console.log('Triage result:');
    let maxKeyLength = 0;
    for (const key in tally) {
        maxKeyLength = Math.max(maxKeyLength, key.length);
    }
    for (const key in tally) {
        const heading = key + ':';
        console.log(`    ${heading.padEnd(maxKeyLength + 1, ' ')} ${tally[key]}`);
    }
}

/**
 *
 */
async function confirmOperations(operations, isUpload) {
    if (isUpload && operations.length === 1 && operations[0].title.includes('Module:Sandbox')) {
        // A fast way to upload tests in the sandbox
        return;
    }

    const unique = {};
    for (const item of operations) {
        const {title, action} = item;
        if ((isUpload && !UPLOAD.has(action)) || (!isUpload && UPLOAD.has(action))) {
            continue;
        }
        unique[title] = unique[title] || [];
        unique[title].push(action);
    }
    if (!Object.keys(unique).length) {
        return;
    }

    const lines = [(isUpload ? 'UPLOAD' : 'DOWNLOAD') + ' needs confirmation:'];
    const sorted = sortJson(unique);
    for (const key in sorted) {
        lines.push(`    ${key} 🡢 ${unique[key].join(', ')}`);
    }
    const message = lines.join('\n');
    const comment = await confirm(message);
    if (comment === null) {
        process.exit(0);
    }
    return comment;
}

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
//  R U N
// =====================================================================================================================
await sync();
