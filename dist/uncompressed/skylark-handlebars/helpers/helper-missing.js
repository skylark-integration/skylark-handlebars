define(['../exception'], function (Exception) {
    'use strict';
    return function (instance) {
        instance.registerHelper('helperMissing', function () {
            if (arguments.length === 1) {
                return undefined;
            } else {
                throw new Exception('Missing helper: "' + arguments[arguments.length - 1].name + '"');
            }
        });
    };
});