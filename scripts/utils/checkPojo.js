/**
 *
 */
function checkPojo(target) {
    return typeof target === 'object' && target !== null && !Array.isArray(target);
}

export default checkPojo;
