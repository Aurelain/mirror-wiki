/**
 * Adapted from `cloneDeep`.
 */
const sortJson = (target) => {
    if (typeof target !== 'object' || target === null) {
        return target;
    }
    return recurse(target);
};

const recurse = (obj) => {
    if (Array.isArray(obj)) {
        const temp = obj.slice();
        const len = temp.length;
        for (let i = 0; i < len; i++) {
            const item = obj[i];
            if (typeof item === 'object' && item !== null) {
                temp[i] = recurse(item);
            }
        }
        return temp;
    } else {
        const temp = Object.assign({}, obj);
        for (const key in obj) {
            const item = obj[key];
            if (typeof item === 'object' && item !== null) {
                temp[key] = recurse(item);
            }
        }
        const keys = Object.keys(temp).sort();
        const sorted = {};
        for (const key of keys) {
            sorted[key] = temp[key];
        }
        return sorted;
    }
};

export default sortJson;
