import fs from 'node:fs';
import {join} from 'node:path';
import {applySettings} from '../helpers/api.js';
import readSettings from '../helpers/readSettings.js';
import getChangesSince from './getChangesSince.js';
import checkPojo from '../utils/checkPojo.js';
import assume from '../utils/assume.js';
import checkString from '../utils/checkString.js';
import checkArray from '../utils/checkArray.js';
import computeSha1 from '../utils/computeSha1.js';
import convertPathToTitle from '../helpers/convertPathToTitle.js';
import readMeta from '../helpers/readMeta.js';
import triageHubs from '../helpers/triageHubs.js';
import confirm from '../utils/confirm.js';
import applyTriage from '../helpers/applyTriage.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
// const BEGINNING_OF_TIME = '2000-01-01T00:00:00Z';
const BEGINNING_OF_TIME = '2026-06-01T00:00:00.123Z';

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

    // Meta:
    const dirPath = settings.DIR_PATH;
    const meta = readMeta(dirPath);
    // const lastUpdate = meta.lastUpdate || BEGINNING_OF_TIME;
    const lastUpdate = BEGINNING_OF_TIME;
    const isAllFresh = lastUpdate === BEGINNING_OF_TIME;
    const metaHub = buildMetaHub(meta);

    // Cloud:
    const pages = await getChangesSince(lastUpdate);
    const changesHub = buildChangesHub(pages);
    const cloudHub = isAllFresh ? changesHub : {...metaHub, ...changesHub};

    // Local:
    const localHub = buildLocalHub(dirPath, dirPath.length + 1);

    // Triage:
    const triageResult = triageHubs(cloudHub, metaHub, localHub);
    if (!triageResult) {
        return console.log('Everything is empty...');
    }
    announceTally(triageResult);
    const importantMessage = getGuardedMessage(triageResult.operations);
    (await confirm(importantMessage)) || process.exit(0);

    // Danger:
    await applyTriage(triageResult.operations, metaHub, dirPath);
    console.log('ok');
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
        assume(checkPojo(page), page, 'page must be pojo!');
        const {title, revisions, ns, imageinfo} = page;
        assume(checkString(title), page, 'title must be a filled string!');
        assume(checkArray(revisions), page, 'revisions must be filled array!');
        assume(revisions.length === 1, page, 'revisions must have only one item!');
        const content = revisions[0]?.['slots']?.main?.content;
        assume(typeof content === 'string', page, 'content must be a string!');
        hub[title] = {
            content,
            sha1: computeSha1(content),
        };
        if (ns === 6) {
            // File:
            const content = imageinfo?.[0]?.url;
            assume(checkString(content), page, 'url must be filled string!');
            const sha1 = imageinfo?.[0]?.sha1;
            assume(checkString(sha1), page, 'sha1 must be filled string!');
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
function getGuardedMessage(list) {
    // const guardedItems = list.filter((item) => item.guard);
    const guardedItems = list;
    if (!guardedItems.length) {
        return '';
    }
    const lines = ['The following operations need confirmation:'];
    for (const item of guardedItems) {
        const {title, action, brief} = item;
        const briefText = brief ? ` (${brief})` : '';
        lines.push(`    ${title} 🡢 ${action}${briefText}`);
    }
    return lines.join('\n');
}

// =====================================================================================================================
//  R U N
// =====================================================================================================================
await download();
