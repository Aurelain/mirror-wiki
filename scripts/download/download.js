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

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
// const BEGINNING_OF_TIME = '2000-01-01T00:00:00Z';
const BEGINNING_OF_TIME = '2026-06-04T00:00:00Z';

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

    // WikiMeta:
    const dirPath = settings.DIR_PATH;
    const meta = getWikiMeta(dirPath);
    let lastUpdate = BEGINNING_OF_TIME;

    // lastUpdate = meta.lastUpdate;

    // Changes:
    const pages = await getChangesSince(lastUpdate);
    const cloudHub = buildCloudHub(pages);
    // console.log('cloudHub:', cloudHub);

    // Local:
    const localHub = buildLocalHub(dirPath, dirPath.length + 1);
    console.log('localHub:', localHub);

    console.log('ok');
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function getWikiMeta(dirPath) {
    try {
        return JSON.parse(fs.readFileSync(dirPath + '/.wiki-meta.json', 'utf8'));
    } catch (e) {
        return {};
    }
}

/**
 *
 */
function buildCloudHub(pages) {
    const hub = {};
    for (const page of pages) {
        assume(checkPojo(page), page, 'page must be pojo!');
        const {title, revisions} = page;
        assume(checkString(title), title, 'title must be a filled string!');
        assume(checkArray(revisions), revisions, 'revisions must be array!');
        assume(revisions.length === 1, revisions, 'revisions must have only one item!');
        const content = revisions[0]?.slots?.main?.content;
        assume(typeof content === 'string', 'content must be a string!');
        hub[title] = {
            content,
            sha1: computeSha1(content),
        };
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
            buildLocalHub(joinedPath, hub);
        } else {
            const content = fs.readFileSync(joinedPath, 'utf8');
            const title = convertPathToTitle(joinedPath.substring(rootPathLength));
            if (title) {
                hub[title] = {
                    content,
                    sha1: computeSha1(content),
                };
            }
        }
    }
    return hub;
}

// =====================================================================================================================
//  R U N
// =====================================================================================================================
await download();
