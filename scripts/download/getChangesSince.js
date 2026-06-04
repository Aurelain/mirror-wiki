import {ask} from '../helpers/api.js';
import assume from '../utils/assume.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
const MAX_LOOP = 200; // how many requests to perform with the continuation system

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
    while (true) {
        assume(i++ < MAX_LOOP, 'Too many loops!', i);
        const somePages = await getSomePages(startTimestamp, continuation);
        allPages.push(...somePages.pages);
        if (!somePages.continuation) {
            break;
        }
        continuation = somePages.continuation;
    }
    console.log(`Retrieved a total of ${allPages.length} pages.`);

    return allPages;
}

/**
 * Sample: https://wiki.hoodedhorse.com/Heroes_of_Might_and_Magic_Olden_Era/api.php?action=query&generator=recentchanges&grcstart=2026-06-01T00%3A00%3A00Z&grcdir=newer&grctoponly=true&grclimit=50&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2
 */
async function getSomePages(startTimestamp, continuation) {
    const response = await ask({
        action: 'query',
        // ---------------- generator:
        generator: 'recentchanges',
        grcstart: startTimestamp,
        grcdir: 'newer',
        grctoponly: true, // only topmost
        grclimit: 50, // because we're requesting "content", we can't go above 50
        // ---------------- prop:
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        // ---------------- continuation:
        ...continuation,
    });
    const pages = response.query?.pages;
    assume(Array.isArray(pages), 'Expecting a pages array!', response);
    console.log(`Retrieved ${pages.length} pages.`);

    return {
        pages,
        continuation: response.continue,
    };
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default getChangesSince;
