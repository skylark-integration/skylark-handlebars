define(['../utils'], function (utils) {
    'use strict';
    return function (instance) {
        instance.registerDecorator('inline', function (fn, props, container, options) {
            let ret = fn;
            if (!props.partials) {
                props.partials = {};
                ret = function (context, options) {
                    let original = container.partials;
                    container.partials = utils.extend({}, original, props.partials);
                    let ret = fn(context, options);
                    container.partials = original;
                    return ret;
                };
            }
            props.partials[options.args[0]] = options.fn;
            return ret;
        });
    };
});