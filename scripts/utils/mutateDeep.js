// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
const mutateDeep = (target, inspect, parameters = null, options = {}) => {
    options.all = options.all ?? false;
    recurse(target, inspect, parameters, options, [target]);
};

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
const recurse = (target, inspect, parameters, options, hierarchy) => {
    // Yes, we're using for-in also for arrays...
    for (const key in target) {
        const value = target[key];
        const isObject = value !== null && typeof value === 'object';
        if (!isObject || options.all) {
            const freshValue = inspect({value, key, hierarchy}, parameters);
            if (freshValue !== undefined) {
                if (freshValue !== null) {
                    // the inspector wants a mutation
                    target[key] = freshValue;
                }
                continue; // if this is an object, we will NOT enter deeper into it
            }
        }
        if (isObject) {
            recurse(value, inspect, parameters, options, [...hierarchy, value]);
        }
    }
};

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default mutateDeep;
