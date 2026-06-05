/**
 * Performs deep strict equality between two values.
 * This function should perform better lodash (see https://github.com/lodash/lodash/issues/3710).
 */
const compareDeep = (a, b) => {
    if (a === undefined || a === null || b === undefined || b === null || typeof a !== 'object') {
        return a === b;
    }

    // At this point, both a and b are pojo or array.

    // Check sizes:
    if (Array.isArray(a)) {
        if (!Array.isArray(b)) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }
    } else {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
    }

    // Yes, we're iterating with for...in through arrays/objects.
    for (const key in a) {
        if (!(key in b)) {
            return false;
        }
        if (!compareDeep(a[key], b[key])) {
            return false;
        }
    }
    for (const key in b) {
        if (!(key in a)) {
            return false;
        }
    }
    return true;
};

export default compareDeep;
