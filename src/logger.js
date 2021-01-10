define(['./utils'], function (utils) {
    'use strict';
    let logger = {
        methodMap: [
            'debug',
            'info',
            'warn',
            'error'
        ],
        level: 'info',
        lookupLevel: function (level) {
            if (typeof level === 'string') {
                let levelMap = utils.indexOf(logger.methodMap, level.toLowerCase());
                if (levelMap >= 0) {
                    level = levelMap;
                } else {
                    level = parseInt(level, 10);
                }
            }
            return level;
        },
        log: function (level, ...message) {
            level = logger.lookupLevel(level);
            if (typeof console !== 'undefined' && logger.lookupLevel(logger.level) <= level) {
                let method = logger.methodMap[level];
                if (!console[method]) {
                    method = 'log';
                }
                console[method](...message);
            }
        }
    };
    return logger;
});