define(['./decorators/inline'], function (registerInline) {
    'use strict';
    function registerDefaultDecorators(instance) {
        registerInline(instance);
    }
    return { registerDefaultDecorators: registerDefaultDecorators };
});