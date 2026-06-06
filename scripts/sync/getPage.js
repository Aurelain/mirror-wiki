import {ask} from '../helpers/api.js';
import assume from '../utils/assume.js';
import checkPojo from '../utils/checkPojo.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function getPage(title) {
    title = title.replace(/\.url$/, '');
    const response = await ask({
        action: 'query',
        prop: 'revisions|imageinfo',
        titles: title,
        rvprop: 'content',
        rvslots: 'main',
        iiprop: 'url|sha1',
    });
    const pages = response.query?.pages || [];
    assume(Array.isArray(pages) && pages.length === 1, response, 'Unexpected pages length!');
    const [page] = pages;
    assume(checkPojo(page), response, 'page must be pojo!');
    return page;
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default getPage;
