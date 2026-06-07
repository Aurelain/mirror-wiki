import {ask} from '../helpers/api.js';
import assume from '../utils/assume.js';
import sleep from '../utils/sleep.js';
import checkArray from '../utils/checkArray.js';
import checkPojo from '../utils/checkPojo.js';
import checkString from '../utils/checkString.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
const MAX_LOOP = 200; // how many requests to perform with the continuation system
const API_LIMIT = 50; // because we're requesting "content", we can't go above 50
const API_SLEEP = 0; // how many milliseconds to wait between requests

// https://wiki.hoodedhorse.com/Heroes_of_Might_and_Magic_Olden_Era/api.php?action=query&meta=siteinfo&siprop=namespaces&format=json
const NAMESPACES = {
    '-2': 'Media',
    '-1': 'Special',
    0: '',
    1: 'Talk',
    2: 'User',
    3: 'User talk',
    4: 'Project',
    5: 'Project talk',
    6: 'File',
    7: 'File talk',
    8: 'MediaWiki',
    9: 'MediaWiki talk',
    10: 'Template',
    11: 'Template talk',
    12: 'Help',
    13: 'Help talk',
    14: 'Category',
    15: 'Category talk',
    828: 'Module',
    829: 'Module talk',
};

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function getChangesSince(startTimestamp) {
    let continuation = {};
    const allPages = [];
    let i = 0;
    const namespaces = startTimestamp ? [null] : Object.keys(NAMESPACES);
    let currentNamespace = namespaces.shift();
    while (true) {
        assume(i++ < MAX_LOOP, 'Too many loops!', i);
        const somePages = await getSomePages(startTimestamp, continuation, currentNamespace);
        allPages.push(...somePages.pages);
        if (!somePages.continuation) {
            if (!namespaces.length) {
                break;
            } else {
                currentNamespace = namespaces.shift();
                continuation = {};
            }
        } else {
            continuation = somePages.continuation;
        }
        await sleep(API_SLEEP);
    }
    console.log(`Retrieved a total of ${allPages.length} pages.`);

    return allPages;
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 * Sample: https://wiki.hoodedhorse.com/Heroes_of_Might_and_Magic_Olden_Era/api.php?action=query&generator=recentchanges&grcstart=2026-06-01T00%3A00%3A00Z&grcdir=newer&grctoponly=true&grclimit=50&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2
 */
async function getSomePages(startTimestamp, continuation, namespace) {
    const params = {
        action: 'query',
        prop: 'revisions|imageinfo',
        rvprop: 'content',
        rvslots: 'main',
        iiprop: 'url|sha1',
        ...continuation,
    };
    if (startTimestamp) {
        Object.assign(params, {
            generator: 'recentchanges',
            grcstart: startTimestamp,
            grcdir: 'newer',
            grctoponly: true, // only topmost
            grclimit: API_LIMIT,
        });
    } else {
        Object.assign(params, {
            generator: 'allpages',
            gapnamespace: namespace, // needed because otherwise we only get the main namespace
            gaplimit: API_LIMIT,
            //gapfilterredir: 'nonredirects',
        });
    }

    const response = await ask(params);
    const pages = validatePages(response.query?.pages);
    console.log(`Retrieved ${pages.length} pages.`);

    return {
        pages,
        continuation: response.continue,
    };
}

/**
 * We placed the validations here, instead of where we need them so we can stop early if problems arise.
 */
function validatePages(pages) {
    if (!checkArray(pages)) {
        return [];
    }
    for (const page of pages) {
        assume(checkPojo(page), page, 'page must be pojo!');
        const {title, revisions, ns, imageinfo} = page;
        assume(checkString(title), page, 'title must be a filled string!');
        if (!revisions) {
            // Note: sometimes the revisions are missing :(
            console.log(`Revisions is missing in "${title}"!`);
            return [];
        }
        assume(checkArray(revisions), page, 'revisions must be filled array!');
        assume(revisions.length === 1, page, 'revisions must have only one item!');
        const content = revisions[0]?.['slots']?.main?.content;
        assume(typeof content === 'string', page, 'content must be a string!');
        if (ns === 6 && imageinfo) {
            // File:
            const content = imageinfo[0]?.url;
            assume(checkString(content), page, 'url must be filled string!');
            const sha1 = imageinfo[0]?.sha1;
            assume(checkString(sha1), page, 'sha1 must be filled string!');
        }
    }
    return pages;
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default getChangesSince;
