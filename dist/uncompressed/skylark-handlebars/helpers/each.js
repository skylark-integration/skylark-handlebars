define([
    '../utils',
    '../exception'
], function (utils, Exception) {
    'use strict';
    return function (instance) {
        instance.registerHelper('each', function (context, options) {
            if (!options) {
                throw new Exception('Must pass iterator to #each');
            }
            let fn = options.fn, inverse = options.inverse, i = 0, ret = '', data, contextPath;
            if (options.data && options.ids) {
                contextPath = utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
            }
            if (utils.isFunction(context)) {
                context = context.call(this);
            }
            if (options.data) {
                data = utils.createFrame(options.data);
            }
            function execIteration(field, index, last) {
                if (data) {
                    data.key = field;
                    data.index = index;
                    data.first = index === 0;
                    data.last = !!last;
                    if (contextPath) {
                        data.contextPath = contextPath + field;
                    }
                }
                ret = ret + fn(context[field], {
                    data: data,
                    blockParams: utils.blockParams([
                        context[field],
                        field
                    ], [
                        contextPath + field,
                        null
                    ])
                });
            }
            if (context && typeof context === 'object') {
                if (utils.isArray(context)) {
                    for (let j = context.length; i < j; i++) {
                        if (i in context) {
                            execIteration(i, i, i === context.length - 1);
                        }
                    }
                } else if (global.Symbol && context[global.Symbol.iterator]) {
                    const newContext = [];
                    const iterator = context[global.Symbol.iterator]();
                    for (let it = iterator.next(); !it.done; it = iterator.next()) {
                        newContext.push(it.value);
                    }
                    context = newContext;
                    for (let j = context.length; i < j; i++) {
                        execIteration(i, i, i === context.length - 1);
                    }
                } else {
                    let priorKey;
                    Object.keys(context).forEach(key => {
                        if (priorKey !== undefined) {
                            execIteration(priorKey, i - 1);
                        }
                        priorKey = key;
                        i++;
                    });
                    if (priorKey !== undefined) {
                        execIteration(priorKey, i - 1, true);
                    }
                }
            }
            if (i === 0) {
                ret = inverse(this);
            }
            return ret;
        });
    };
});