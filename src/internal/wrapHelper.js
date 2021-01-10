define(function () {
    'use strict';
    function wrapHelper(helper, transformOptionsFn) {
        if (typeof helper !== 'function') {
            return helper;
        }
        let wrapper = function () {
            const options = arguments[arguments.length - 1];
            arguments[arguments.length - 1] = transformOptionsFn(options);
            return helper.apply(this, arguments);
        };
        return wrapper;
    }
    return { wrapHelper: wrapHelper };
});