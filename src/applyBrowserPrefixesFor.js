/**
 *  refer to https://github.com/HaNdTriX/generator-chrome-extension-kickstart/blob/master/app/templates/tasks/lib/applyBrowserPrefixesFor.js
 * 
 *  Converts and removes keys with a
 *  prefix to the key without prefix
 * @param  {String} vendor
 * @return {Function}
 */
module.exports = function applyBrowserPrefixesFor(vendor) {
    /**
     * Converts and removes keys with a
     * prefix to the key without prefix
     *
     * Recursive iterator over all object keys
     *
     * Example:
     *
     *    chrome|keyName
     *    firefox|keyName
     *    opera|keyName
     *    edge|keyName
     *
     * to `keyName`.
     * This way we can write one manifest thats valid
     * for all browsers
     *
     * @param  {Object} manifest
     * @return {Object}
     */
    return function iterator(obj) {
        Object.keys(obj).forEach(key => {
            const vbarIndex = key.lastIndexOf('|')

            if (vbarIndex != -1) {
                const venders = key.substring(0, vbarIndex)
                const targetKey = key.substring(vbarIndex + 1)
                // Swap key with non prefixed name
                if (venders.indexOf(vendor) !== -1) {
                    obj[targetKey] = obj[key]
                }

                // Remove the prefixed key
                // so it won't cause warings
                delete obj[key]
            } else {
                // no match? try deeper
                // Recurse over object's inner keys
                if (typeof obj[key] === 'object') {
                    iterator(obj[key])
                }
            }
        })

        return obj
    };
};
