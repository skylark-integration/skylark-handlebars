define([
    '../utils',
    '../exception'
], function (utils, Exception) {
    'use strict';
    return function (instance) {
        instance.registerHelper('if', function (conditional, options) {
            if (arguments.length != 2) {
                throw new Exception('#if requires exactly one argument');
            }
            if (utils.isFunction(conditional)) {
                conditional = conditional.call(this);
            }
            if (!options.hash.includeZero && !conditional || utils.isEmpty(conditional)) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        });
        instance.registerHelper('unless', function (conditional, options) {
            if (arguments.length != 2) {
                throw new Exception('#unless requires exactly one argument');
            }
            return instance.helpers['if'].call(this, conditional, {
                fn: options.inverse,
                inverse: options.fn,
                hash: options.hash
            });
        });
    };
});