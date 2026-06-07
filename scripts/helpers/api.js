import assume from '../utils/assume.js';

// =====================================================================================================================
//  D E C L A R A T I O N S
// =====================================================================================================================
let settings;
let cookies;

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function ask(params) {
    assume(settings, 'Please call applySettings() prior to asking!');
    const method = detectMethod(params);

    // Headers:
    const options = {
        method,
        headers: getHeaders(),
    };

    // Parameters:
    const url = new URL(settings.API_URL);
    const requestParams = adaptParams(params); // removes `method` and may return formData
    if (method === 'GET') {
        url.search = requestParams.toString();
    } else {
        options.body = requestParams;
    }

    // Actual request:
    announceAction(method, params, url);
    const response = await fetch(url, options);
    // console.log('url:', url);

    // Cookies:
    const cookiesList = response.headers.getSetCookie();
    if (cookiesList && cookiesList.length > 0) {
        cookies += '; ' + cookiesList.map((c) => c.split(';')[0]).join('; ');
    }

    // Output:
    return await parseResponse(response);
}

/**
 *
 */
function applySettings(config) {
    const {CF_CLEARANCE, API_URL, USER_AGENT} = config;
    assume(CF_CLEARANCE, 'No CF_CLEARANCE in settings!');
    assume(API_URL, 'No API_URL in settings!');
    assume(USER_AGENT, 'No USER_AGENT in settings!');
    settings = {API_URL, USER_AGENT};
    cookies = `cf_clearance=${CF_CLEARANCE}`;
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function detectMethod(params) {
    return !params.method || params.method === 'GET' ? 'GET' : 'POST';
}

/**
 *
 */
function announceAction(method, params, url) {
    const parts = [method + ':', params.action];
    if (params.action === 'query') {
        parts.push(url.search);
    }
    console.log(parts.join(' '));
}

/**
 *
 */
function adaptParams(params) {
    let adapted = {...params, format: 'json', formatversion: 2};
    const {method} = adapted;
    delete adapted.method;

    if (method === 'FORM') {
        const formData = new FormData();
        for (const key in adapted) {
            const value = adapted[key];
            if (Array.isArray(value)) {
                formData.append(key, value[0], value[1]);
            } else {
                formData.append(key, value);
            }
        }
        return formData;
    }

    return new URLSearchParams(adapted);
}

/**
 *
 */
async function parseResponse(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (err) {
        const short = text.substring(0, 100).replaceAll(/\s/g, ' ');
        assume(false, err.message, 'Response was: ' + short, 'Check CF_CLEARANCE!');
    }
}

/**
 *
 */
function getHeaders() {
    return {
        Cookie: cookies,
        'User-Agent': settings.USER_AGENT,
    };
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export {ask, applySettings, getHeaders};
