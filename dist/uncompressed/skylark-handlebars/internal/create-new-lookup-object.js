define(['../utils'], function (utils) {
    'use strict';
    function createNewLookupObject(...sources) {
        return utils.extend(Object.create(null), ...sources);
    }
    return { createNewLookupObject: createNewLookupObject };
});