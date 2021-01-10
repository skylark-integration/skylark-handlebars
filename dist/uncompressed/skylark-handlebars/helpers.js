define([
    './helpers/block-helper-missing',
    './helpers/each',
    './helpers/helper-missing',
    './helpers/if',
    './helpers/log',
    './helpers/lookup',
    './helpers/with'
], function (registerBlockHelperMissing, registerEach, registerHelperMissing, registerIf, registerLog, registerLookup, registerWith) {
    'use strict';
    function registerDefaultHelpers(instance) {
        registerBlockHelperMissing(instance);
        registerEach(instance);
        registerHelperMissing(instance);
        registerIf(instance);
        registerLog(instance);
        registerLookup(instance);
        registerWith(instance);
    }
    function moveHelperToHooks(instance, helperName, keepHelper) {
        if (instance.helpers[helperName]) {
            instance.hooks[helperName] = instance.helpers[helperName];
            if (!keepHelper) {
                delete instance.helpers[helperName];
            }
        }
    }
    return {
        registerDefaultHelpers: registerDefaultHelpers,
        moveHelperToHooks: moveHelperToHooks
    };
});