import getPage from './getPage.js';
import assume from '../utils/assume.js';
import checkString from '../utils/checkString.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 * When a local file has been accidentally deleted, we should restore it. However, the wiki-meta.json file doesn't
 * hold its actual content (only its hash), so we need to get it from somewhere.
 */
async function healTriage({operations}) {
    for (const operation of operations) {
        const {content, title} = operation;
        if (content === undefined) {
            console.log(`Healing ${title}...`);
            const page = await getPage(title);
            if (title.endsWith('.url')) {
                operation.value = page.imageinfo?.[0]?.url;
                assume(checkString(operation.value), page, 'url must be filled string!');
            } else {
                operation.value = page.revisions[0]?.['slots']?.main?.content;
                assume(typeof operation.value === 'string', page, 'content must be a string!');
            }
        }
    }
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default healTriage;
