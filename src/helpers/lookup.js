define(function () {
    'use strict';
    return function (instance) {
        instance.registerHelper('lookup', function (obj, field, options) {
            if (!obj) {
                return obj;
            }
            return options.lookupProperty(obj, field);
        });
    };
});