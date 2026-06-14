import {ask} from './api.js';
import assume from '../utils/assume.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function uploadPage(title, content, csrfToken, comment = '') {
    console.log(`Uploading content for: ${title}...`);
    const editResponse = await ask({
        method: 'POST',
        action: 'edit',
        title,
        text: content,
        token: csrfToken,
        bot: '1', // does nothing if the Bot doesn't appear in `Special:ListUsers/bot`
        summary: comment,
    });
    assume(editResponse?.edit?.result === 'Success', editResponse, 'Edit failed!');
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default uploadPage;
