define([
    '../utils',
    '../exception'
], function (utils, Exception) {
    'use strict';
    return function (instance) {
        instance.registerHelper('with', function (context, options) {
            if (arguments.length != 2) {
                throw new Exception('#with requires exactly one argument');
            }
            if (utils.isFunction(context)) {
                context = context.call(this);
            }
            let fn = options.fn;
            if (!utils.isEmpty(context)) {
                let data = options.data;
                if (options.data && options.ids) {
                    data = utils.createFrame(options.data);
                    data.contextPath = utils.appendContextPath(options.data.contextPath, options.ids[0]);
                }
                return fn(context, {
                    data: data,
                    blockParams: utils.blockParams([context], [data && data.contextPath])
                });
            } else {
                return options.inverse(this);
            }
        });
    };
});