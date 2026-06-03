import {ask} from './api.js';
import assume from '../utils/assume.js';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function getCsrfToken(username, password) {
    const token = await getLoginToken();
    await performLogin(token, username, password);

    // Actual csrf request:
    const csrfResponse = await ask({
        action: 'query',
        meta: 'tokens',
    });
    const csrfToken = csrfResponse?.query?.tokens?.csrftoken;
    assume(csrfToken, 'Invalid csrf token!', csrfToken);
    return csrfToken;
}

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function getLoginToken() {
    const tokenResponse = await ask({
        action: 'query',
        meta: 'tokens',
        type: 'login',
    });
    const token = tokenResponse?.query?.tokens?.logintoken;
    assume(token, 'No token found!', tokenResponse);
    return token;
}

/**
 *
 */
async function performLogin(token, username, password) {
    const loginResponse = await ask({
        method: 'POST',
        action: 'login',
        lgname: username,
        lgpassword: password,
        lgtoken: token,
    });
    const result = loginResponse?.login?.result;
    assume(result === 'Success', 'Login failed!', loginResponse);
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default getCsrfToken;
