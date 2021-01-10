define([
    './utils',
    './exception',
    './helpers',
    './decorators',
    './logger',
    './internal/proto-access'
], function (utils, Exception, helpers, c, logger, protoAccess) {
    'use strict';
    const VERSION = '4.7.6';
    const COMPILER_REVISION = 8;
    const LAST_COMPATIBLE_COMPILER_REVISION = 7;
    const REVISION_CHANGES = {
        1: '<= 1.0.rc.2',
        2: '== 1.0.0-rc.3',
        3: '== 1.0.0-rc.4',
        4: '== 1.x.x',
        5: '== 2.0.0-alpha.x',
        6: '>= 2.0.0-beta.1',
        7: '>= 4.0.0 <4.3.0',
        8: '>= 4.3.0'
    };
    const objectType = '[object Object]';
    function HandlebarsEnvironment(helpers, partials, decorators) {
        this.helpers = helpers || {};
        this.partials = partials || {};
        this.decorators = decorators || {};
        helpers.registerDefaultHelpers(this);
        c.registerDefaultDecorators(this);
    }
    HandlebarsEnvironment.prototype = {
        constructor: HandlebarsEnvironment,
        logger: logger,
        log: logger.log,
        registerHelper: function (name, fn) {
            if (utils.toString.call(name) === objectType) {
                if (fn) {
                    throw new Exception('Arg not supported with multiple helpers');
                }
                utils.extend(this.helpers, name);
            } else {
                this.helpers[name] = fn;
            }
        },
        unregisterHelper: function (name) {
            delete this.helpers[name];
        },
        registerPartial: function (name, partial) {
            if (utils.toString.call(name) === objectType) {
                utils.extend(this.partials, name);
            } else {
                if (typeof partial === 'undefined') {
                    throw new Exception(`Attempting to register a partial called "${ name }" as undefined`);
                }
                this.partials[name] = partial;
            }
        },
        unregisterPartial: function (name) {
            delete this.partials[name];
        },
        registerDecorator: function (name, fn) {
            if (utils.toString.call(name) === objectType) {
                if (fn) {
                    throw new Exception('Arg not supported with multiple decorators');
                }
                utils.extend(this.decorators, name);
            } else {
                this.decorators[name] = fn;
            }
        },
        unregisterDecorator: function (name) {
            delete this.decorators[name];
        },
        resetLoggedPropertyAccesses: function () {
            protoAccess.resetLoggedProperties();
        }
    };
    let log = logger.log,
        createFrame = utils.createFrame;
    return {
        VERSION,
        COMPILER_REVISION,
        LAST_COMPATIBLE_COMPILER_REVISION,
        REVISION_CHANGES,
        HandlebarsEnvironment,
        log,
        createFrame,
        logger
    };
});