/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-handlebars/utils',[],function () {
    'use strict';
    const escape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    const badChars = /[&<>"'`=]/g, possible = /[&<>"'`=]/;
    function escapeChar(chr) {
        return escape[chr];
    }
    function extend(obj) {
        for (let i = 1; i < arguments.length; i++) {
            for (let key in arguments[i]) {
                if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
                    obj[key] = arguments[i][key];
                }
            }
        }
        return obj;
    }
    let toString = Object.prototype.toString;
    let isFunction = function (value) {
        return typeof value === 'function';
    };
    if (isFunction(/x/)) {
        isFunction = function (value) {
            return typeof value === 'function' && toString.call(value) === '[object Function]';
        };
    }
    const isArray = Array.isArray || function (value) {
        return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
    };
    function indexOf(array, value) {
        for (let i = 0, len = array.length; i < len; i++) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }
    function escapeExpression(string) {
        if (typeof string !== 'string') {
            if (string && string.toHTML) {
                return string.toHTML();
            } else if (string == null) {
                return '';
            } else if (!string) {
                return string + '';
            }
            string = '' + string;
        }
        if (!possible.test(string)) {
            return string;
        }
        return string.replace(badChars, escapeChar);
    }
    function isEmpty(value) {
        if (!value && value !== 0) {
            return true;
        } else if (isArray(value) && value.length === 0) {
            return true;
        } else {
            return false;
        }
    }
    function createFrame(object) {
        let frame = extend({}, object);
        frame._parent = object;
        return frame;
    }
    function blockParams(params, ids) {
        params.path = ids;
        return params;
    }
    function appendContextPath(contextPath, id) {
        return (contextPath ? contextPath + '.' : '') + id;
    }
    return {
        extend: extend,
        toString: toString,
        isFunction,
        isArray: isArray,
        indexOf: indexOf,
        escapeExpression: escapeExpression,
        isEmpty: isEmpty,
        createFrame: createFrame,
        blockParams: blockParams,
        appendContextPath: appendContextPath
    };
});
define('skylark-handlebars/exception',[],function () {
    'use strict';
    const errorProps = [
        'description',
        'fileName',
        'lineNumber',
        'endLineNumber',
        'message',
        'name',
        'number',
        'stack'
    ];
    function Exception(message, node) {
        let loc = node && node.loc, line, endLineNumber, column, endColumn;
        if (loc) {
            line = loc.start.line;
            endLineNumber = loc.end.line;
            column = loc.start.column;
            endColumn = loc.end.column;
            message += ' - ' + line + ':' + column;
        }
        let tmp = Error.prototype.constructor.call(this, message);
        for (let idx = 0; idx < errorProps.length; idx++) {
            this[errorProps[idx]] = tmp[errorProps[idx]];
        }
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Exception);
        }
        try {
            if (loc) {
                this.lineNumber = line;
                this.endLineNumber = endLineNumber;
                if (Object.defineProperty) {
                    Object.defineProperty(this, 'column', {
                        value: column,
                        enumerable: true
                    });
                    Object.defineProperty(this, 'endColumn', {
                        value: endColumn,
                        enumerable: true
                    });
                } else {
                    this.column = column;
                    this.endColumn = endColumn;
                }
            }
        } catch (nop) {
        }
    }
    Exception.prototype = new Error();
    return Exception;
});
define('skylark-handlebars/helpers/block-helper-missing',['../utils'], function (utils) {
    'use strict';
    return function (instance) {
        instance.registerHelper('blockHelperMissing', function (context, options) {
            let inverse = options.inverse, fn = options.fn;
            if (context === true) {
                return fn(this);
            } else if (context === false || context == null) {
                return inverse(this);
            } else if (utils.isArray(context)) {
                if (context.length > 0) {
                    if (options.ids) {
                        options.ids = [options.name];
                    }
                    return instance.helpers.each(context, options);
                } else {
                    return inverse(this);
                }
            } else {
                if (options.data && options.ids) {
                    let data = utils.createFrame(options.data);
                    data.contextPath = utils.appendContextPath(options.data.contextPath, options.name);
                    options = { data: data };
                }
                return fn(context, options);
            }
        });
    };
});
define('skylark-handlebars/helpers/each',[
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
define('skylark-handlebars/helpers/helper-missing',['../exception'], function (Exception) {
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
define('skylark-handlebars/helpers/if',[
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
define('skylark-handlebars/helpers/log',[],function () {
    'use strict';
    return function (instance) {
        instance.registerHelper('log', function () {
            let args = [undefined], options = arguments[arguments.length - 1];
            for (let i = 0; i < arguments.length - 1; i++) {
                args.push(arguments[i]);
            }
            let level = 1;
            if (options.hash.level != null) {
                level = options.hash.level;
            } else if (options.data && options.data.level != null) {
                level = options.data.level;
            }
            args[0] = level;
            instance.log(...args);
        });
    };
});
define('skylark-handlebars/helpers/lookup',[],function () {
    'use strict';
    return function (instance) {
        instance.registerHelper('lookup', function (obj, field, options) {
            if (!obj) {
                return obj;
            }
            return options.lookupProperty(obj, field);
        });
    };
});
define('skylark-handlebars/helpers/with',[
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
define('skylark-handlebars/helpers',[
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
define('skylark-handlebars/decorators/inline',['../utils'], function (utils) {
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
define('skylark-handlebars/decorators',['./decorators/inline'], function (registerInline) {
    'use strict';
    function registerDefaultDecorators(instance) {
        registerInline(instance);
    }
    return { registerDefaultDecorators: registerDefaultDecorators };
});
define('skylark-handlebars/logger',['./utils'], function (utils) {
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
define('skylark-handlebars/internal/create-new-lookup-object',['../utils'], function (utils) {
    'use strict';
    function createNewLookupObject(...sources) {
        return utils.extend(Object.create(null), ...sources);
    }
    return { createNewLookupObject: createNewLookupObject };
});
define('skylark-handlebars/internal/proto-access',[
    './create-new-lookup-object',
    '../logger'
], function (a, logger) {
    'use strict';
    const loggedProperties = Object.create(null);
    function createProtoAccessControl(runtimeOptions) {
        let defaultMethodWhiteList = Object.create(null);
        defaultMethodWhiteList['constructor'] = false;
        defaultMethodWhiteList['__defineGetter__'] = false;
        defaultMethodWhiteList['__defineSetter__'] = false;
        defaultMethodWhiteList['__lookupGetter__'] = false;
        let defaultPropertyWhiteList = Object.create(null);
        defaultPropertyWhiteList['__proto__'] = false;
        return {
            properties: {
                whitelist: a.createNewLookupObject(defaultPropertyWhiteList, runtimeOptions.allowedProtoProperties),
                defaultValue: runtimeOptions.allowProtoPropertiesByDefault
            },
            methods: {
                whitelist: a.createNewLookupObject(defaultMethodWhiteList, runtimeOptions.allowedProtoMethods),
                defaultValue: runtimeOptions.allowProtoMethodsByDefault
            }
        };
    }
    function resultIsAllowed(result, protoAccessControl, propertyName) {
        if (typeof result === 'function') {
            return checkWhiteList(protoAccessControl.methods, propertyName);
        } else {
            return checkWhiteList(protoAccessControl.properties, propertyName);
        }
    }
    function checkWhiteList(protoAccessControlForType, propertyName) {
        if (protoAccessControlForType.whitelist[propertyName] !== undefined) {
            return protoAccessControlForType.whitelist[propertyName] === true;
        }
        if (protoAccessControlForType.defaultValue !== undefined) {
            return protoAccessControlForType.defaultValue;
        }
        logUnexpecedPropertyAccessOnce(propertyName);
        return false;
    }
    function logUnexpecedPropertyAccessOnce(propertyName) {
        if (loggedProperties[propertyName] !== true) {
            loggedProperties[propertyName] = true;
            logger.log('error', `Handlebars: Access has been denied to resolve the property "${ propertyName }" because it is not an "own property" of its parent.\n` + `You can add a runtime option to disable the check or this warning:\n` + `See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details`);
        }
    }
    function resetLoggedProperties() {
        Object.keys(loggedProperties).forEach(propertyName => {
            delete loggedProperties[propertyName];
        });
    }
    return {
        createProtoAccessControl: createProtoAccessControl,
        resultIsAllowed: resultIsAllowed,
        resetLoggedProperties: resetLoggedProperties
    };
});
define('skylark-handlebars/base',[
    './utils',
    './exception',
    './helpers',
    './decorators',
    './logger',
    './internal/proto-access'
], function (utils, Exception, b, c, logger, protoAccess) {
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
        b.registerDefaultHelpers(this);
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
define('skylark-handlebars/internal/wrapHelper',[],function () {
    'use strict';
    function wrapHelper(helper, transformOptionsFn) {
        if (typeof helper !== 'function') {
            return helper;
        }
        let wrapper = function () {
            const options = arguments[arguments.length - 1];
            arguments[arguments.length - 1] = transformOptionsFn(options);
            return helper.apply(this, arguments);
        };
        return wrapper;
    }
    return { wrapHelper: wrapHelper };
});
define('skylark-handlebars/runtime',[
    './utils',
    './exception',
    './base',
    './helpers',
    './internal/wrapHelper',
    './internal/proto-access'
], function (Utils, Exception, a, b, c, d) {
    'use strict';
    function checkRevision(compilerInfo) {
        const compilerRevision = compilerInfo && compilerInfo[0] || 1, currentRevision = a.COMPILER_REVISION;
        if (compilerRevision >= a.LAST_COMPATIBLE_COMPILER_REVISION && compilerRevision <= a.COMPILER_REVISION) {
            return;
        }
        if (compilerRevision < a.LAST_COMPATIBLE_COMPILER_REVISION) {
            const runtimeVersions = a.REVISION_CHANGES[currentRevision], compilerVersions = a.REVISION_CHANGES[compilerRevision];
            throw new Exception('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
        } else {
            throw new Exception('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
        }
    }
    function template(templateSpec, env) {
        if (!env) {
            throw new Exception('No environment passed to template');
        }
        if (!templateSpec || !templateSpec.main) {
            throw new Exception('Unknown template object: ' + typeof templateSpec);
        }
        templateSpec.main.decorator = templateSpec.main_d;
        env.VM.checkRevision(templateSpec.compiler);
        const templateWasPrecompiledWithCompilerV7 = templateSpec.compiler && templateSpec.compiler[0] === 7;
        function invokePartialWrapper(partial, context, options) {
            if (options.hash) {
                context = Utils.extend({}, context, options.hash);
                if (options.ids) {
                    options.ids[0] = true;
                }
            }
            partial = env.VM.resolvePartial.call(this, partial, context, options);
            let extendedOptions = Utils.extend({}, options, {
                hooks: this.hooks,
                protoAccessControl: this.protoAccessControl
            });
            let result = env.VM.invokePartial.call(this, partial, context, extendedOptions);
            if (result == null && env.compile) {
                options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
                result = options.partials[options.name](context, extendedOptions);
            }
            if (result != null) {
                if (options.indent) {
                    let lines = result.split('\n');
                    for (let i = 0, l = lines.length; i < l; i++) {
                        if (!lines[i] && i + 1 === l) {
                            break;
                        }
                        lines[i] = options.indent + lines[i];
                    }
                    result = lines.join('\n');
                }
                return result;
            } else {
                throw new Exception('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
            }
        }
        let container = {
            strict: function (obj, name, loc) {
                if (!obj || !(name in obj)) {
                    throw new Exception('"' + name + '" not defined in ' + obj, { loc: loc });
                }
                return obj[name];
            },
            lookupProperty: function (parent, propertyName) {
                let result = parent[propertyName];
                if (result == null) {
                    return result;
                }
                if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
                    return result;
                }
                if (d.resultIsAllowed(result, container.protoAccessControl, propertyName)) {
                    return result;
                }
                return undefined;
            },
            lookup: function (depths, name) {
                const len = depths.length;
                for (let i = 0; i < len; i++) {
                    let result = depths[i] && container.lookupProperty(depths[i], name);
                    if (result != null) {
                        return depths[i][name];
                    }
                }
            },
            lambda: function (current, context) {
                return typeof current === 'function' ? current.call(context) : current;
            },
            escapeExpression: Utils.escapeExpression,
            invokePartial: invokePartialWrapper,
            fn: function (i) {
                let ret = templateSpec[i];
                ret.decorator = templateSpec[i + '_d'];
                return ret;
            },
            programs: [],
            program: function (i, data, declaredBlockParams, blockParams, depths) {
                let programWrapper = this.programs[i], fn = this.fn(i);
                if (data || depths || blockParams || declaredBlockParams) {
                    programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
                } else if (!programWrapper) {
                    programWrapper = this.programs[i] = wrapProgram(this, i, fn);
                }
                return programWrapper;
            },
            data: function (value, depth) {
                while (value && depth--) {
                    value = value._parent;
                }
                return value;
            },
            mergeIfNeeded: function (param, common) {
                let obj = param || common;
                if (param && common && param !== common) {
                    obj = Utils.extend({}, common, param);
                }
                return obj;
            },
            nullContext: Object.seal({}),
            noop: env.VM.noop,
            compilerInfo: templateSpec.compiler
        };
        function ret(context, options = {}) {
            let data = options.data;
            ret._setup(options);
            if (!options.partial && templateSpec.useData) {
                data = initData(context, data);
            }
            let depths, blockParams = templateSpec.useBlockParams ? [] : undefined;
            if (templateSpec.useDepths) {
                if (options.depths) {
                    depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
                } else {
                    depths = [context];
                }
            }
            function main(context) {
                return '' + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
            }
            main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
            return main(context, options);
        }
        ret.isTop = true;
        ret._setup = function (options) {
            if (!options.partial) {
                let mergedHelpers = Utils.extend({}, env.helpers, options.helpers);
                wrapHelpersToPassLookupProperty(mergedHelpers, container);
                container.helpers = mergedHelpers;
                if (templateSpec.usePartial) {
                    container.partials = container.mergeIfNeeded(options.partials, env.partials);
                }
                if (templateSpec.usePartial || templateSpec.useDecorators) {
                    container.decorators = Utils.extend({}, env.decorators, options.decorators);
                }
                container.hooks = {};
                container.protoAccessControl = d.createProtoAccessControl(options);
                let keepHelperInHelpers = options.allowCallsToHelperMissing || templateWasPrecompiledWithCompilerV7;
                b.moveHelperToHooks(container, 'helperMissing', keepHelperInHelpers);
                b.moveHelperToHooks(container, 'blockHelperMissing', keepHelperInHelpers);
            } else {
                container.protoAccessControl = options.protoAccessControl;
                container.helpers = options.helpers;
                container.partials = options.partials;
                container.decorators = options.decorators;
                container.hooks = options.hooks;
            }
        };
        ret._child = function (i, data, blockParams, depths) {
            if (templateSpec.useBlockParams && !blockParams) {
                throw new Exception('must pass block params');
            }
            if (templateSpec.useDepths && !depths) {
                throw new Exception('must pass parent depths');
            }
            return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
        };
        return ret;
    }
    function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
        function prog(context, options = {}) {
            let currentDepths = depths;
            if (depths && context != depths[0] && !(context === container.nullContext && depths[0] === null)) {
                currentDepths = [context].concat(depths);
            }
            return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
        }
        prog = executeDecorators(fn, prog, container, depths, data, blockParams);
        prog.program = i;
        prog.depth = depths ? depths.length : 0;
        prog.blockParams = declaredBlockParams || 0;
        return prog;
    }
    function resolvePartial(partial, context, options) {
        if (!partial) {
            if (options.name === '@partial-block') {
                partial = options.data['partial-block'];
            } else {
                partial = options.partials[options.name];
            }
        } else if (!partial.call && !options.name) {
            options.name = partial;
            partial = options.partials[partial];
        }
        return partial;
    }
    function invokePartial(partial, context, options) {
        const currentPartialBlock = options.data && options.data['partial-block'];
        options.partial = true;
        if (options.ids) {
            options.data.contextPath = options.ids[0] || options.data.contextPath;
        }
        let partialBlock;
        if (options.fn && options.fn !== noop) {
            options.data = a.createFrame(options.data);
            let fn = options.fn;
            partialBlock = options.data['partial-block'] = function partialBlockWrapper(context, options = {}) {
                options.data = a.createFrame(options.data);
                options.data['partial-block'] = currentPartialBlock;
                return fn(context, options);
            };
            if (fn.partials) {
                options.partials = Utils.extend({}, options.partials, fn.partials);
            }
        }
        if (partial === undefined && partialBlock) {
            partial = partialBlock;
        }
        if (partial === undefined) {
            throw new Exception('The partial ' + options.name + ' could not be found');
        } else if (partial instanceof Function) {
            return partial(context, options);
        }
    }
    function noop() {
        return '';
    }
    function initData(context, data) {
        if (!data || !('root' in data)) {
            data = data ? a.createFrame(data) : {};
            data.root = context;
        }
        return data;
    }
    function executeDecorators(fn, prog, container, depths, data, blockParams) {
        if (fn.decorator) {
            let props = {};
            prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
            Utils.extend(prog, props);
        }
        return prog;
    }
    function wrapHelpersToPassLookupProperty(mergedHelpers, container) {
        Object.keys(mergedHelpers).forEach(helperName => {
            let helper = mergedHelpers[helperName];
            mergedHelpers[helperName] = passLookupPropertyOption(helper, container);
        });
    }
    function passLookupPropertyOption(helper, container) {
        const lookupProperty = container.lookupProperty;
        return c.wrapHelper(helper, options => {
            return Utils.extend({ lookupProperty }, options);
        });
    }
    return {
        checkRevision: checkRevision,
        template: template,
        wrapProgram: wrapProgram,
        resolvePartial: resolvePartial,
        invokePartial: invokePartial,
        noop: noop
    };
});
define('skylark-handlebars/safe-string',[],function () {
    'use strict';
    function SafeString(string) {
        this.string = string;
    }
    SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
        return '' + this.string;
    };
    return SafeString;
});
define('skylark-handlebars/compiler/ast',[],function () {
    'use strict';
    let AST = {
        helpers: {
            helperExpression: function (node) {
                return node.type === 'SubExpression' || (node.type === 'MustacheStatement' || node.type === 'BlockStatement') && !!(node.params && node.params.length || node.hash);
            },
            scopedId: function (path) {
                return /^\.|this\b/.test(path.original);
            },
            simpleId: function (path) {
                return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
            }
        }
    };
    return AST;
});
define('skylark-handlebars/compiler/parser',[],function(){

	// File ignored in coverage tests via setting in .istanbul.yml
	/* Jison generated parser */
	"use strict";
	var handlebars = (function () {
	    var parser = { trace: function trace() {},
	        yy: {},
	        symbols_: { "error": 2, "root": 3, "program": 4, "EOF": 5, "program_repetition0": 6, "statement": 7, "mustache": 8, "block": 9, "rawBlock": 10, "partial": 11, "partialBlock": 12, "content": 13, "COMMENT": 14, "CONTENT": 15, "openRawBlock": 16, "rawBlock_repetition0": 17, "END_RAW_BLOCK": 18, "OPEN_RAW_BLOCK": 19, "helperName": 20, "openRawBlock_repetition0": 21, "openRawBlock_option0": 22, "CLOSE_RAW_BLOCK": 23, "openBlock": 24, "block_option0": 25, "closeBlock": 26, "openInverse": 27, "block_option1": 28, "OPEN_BLOCK": 29, "openBlock_repetition0": 30, "openBlock_option0": 31, "openBlock_option1": 32, "CLOSE": 33, "OPEN_INVERSE": 34, "openInverse_repetition0": 35, "openInverse_option0": 36, "openInverse_option1": 37, "openInverseChain": 38, "OPEN_INVERSE_CHAIN": 39, "openInverseChain_repetition0": 40, "openInverseChain_option0": 41, "openInverseChain_option1": 42, "inverseAndProgram": 43, "INVERSE": 44, "inverseChain": 45, "inverseChain_option0": 46, "OPEN_ENDBLOCK": 47, "OPEN": 48, "mustache_repetition0": 49, "mustache_option0": 50, "OPEN_UNESCAPED": 51, "mustache_repetition1": 52, "mustache_option1": 53, "CLOSE_UNESCAPED": 54, "OPEN_PARTIAL": 55, "partialName": 56, "partial_repetition0": 57, "partial_option0": 58, "openPartialBlock": 59, "OPEN_PARTIAL_BLOCK": 60, "openPartialBlock_repetition0": 61, "openPartialBlock_option0": 62, "param": 63, "sexpr": 64, "OPEN_SEXPR": 65, "sexpr_repetition0": 66, "sexpr_option0": 67, "CLOSE_SEXPR": 68, "hash": 69, "hash_repetition_plus0": 70, "hashSegment": 71, "ID": 72, "EQUALS": 73, "blockParams": 74, "OPEN_BLOCK_PARAMS": 75, "blockParams_repetition_plus0": 76, "CLOSE_BLOCK_PARAMS": 77, "path": 78, "dataName": 79, "STRING": 80, "NUMBER": 81, "BOOLEAN": 82, "UNDEFINED": 83, "NULL": 84, "DATA": 85, "pathSegments": 86, "SEP": 87, "$accept": 0, "$end": 1 },
	        terminals_: { 2: "error", 5: "EOF", 14: "COMMENT", 15: "CONTENT", 18: "END_RAW_BLOCK", 19: "OPEN_RAW_BLOCK", 23: "CLOSE_RAW_BLOCK", 29: "OPEN_BLOCK", 33: "CLOSE", 34: "OPEN_INVERSE", 39: "OPEN_INVERSE_CHAIN", 44: "INVERSE", 47: "OPEN_ENDBLOCK", 48: "OPEN", 51: "OPEN_UNESCAPED", 54: "CLOSE_UNESCAPED", 55: "OPEN_PARTIAL", 60: "OPEN_PARTIAL_BLOCK", 65: "OPEN_SEXPR", 68: "CLOSE_SEXPR", 72: "ID", 73: "EQUALS", 75: "OPEN_BLOCK_PARAMS", 77: "CLOSE_BLOCK_PARAMS", 80: "STRING", 81: "NUMBER", 82: "BOOLEAN", 83: "UNDEFINED", 84: "NULL", 85: "DATA", 87: "SEP" },
	        productions_: [0, [3, 2], [4, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [13, 1], [10, 3], [16, 5], [9, 4], [9, 4], [24, 6], [27, 6], [38, 6], [43, 2], [45, 3], [45, 1], [26, 3], [8, 5], [8, 5], [11, 5], [12, 3], [59, 5], [63, 1], [63, 1], [64, 5], [69, 1], [71, 3], [74, 3], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [56, 1], [56, 1], [79, 2], [78, 1], [86, 3], [86, 1], [6, 0], [6, 2], [17, 0], [17, 2], [21, 0], [21, 2], [22, 0], [22, 1], [25, 0], [25, 1], [28, 0], [28, 1], [30, 0], [30, 2], [31, 0], [31, 1], [32, 0], [32, 1], [35, 0], [35, 2], [36, 0], [36, 1], [37, 0], [37, 1], [40, 0], [40, 2], [41, 0], [41, 1], [42, 0], [42, 1], [46, 0], [46, 1], [49, 0], [49, 2], [50, 0], [50, 1], [52, 0], [52, 2], [53, 0], [53, 1], [57, 0], [57, 2], [58, 0], [58, 1], [61, 0], [61, 2], [62, 0], [62, 1], [66, 0], [66, 2], [67, 0], [67, 1], [70, 1], [70, 2], [76, 1], [76, 2]],
	        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

	            var $0 = $$.length - 1;
	            switch (yystate) {
	                case 1:
	                    return $$[$0 - 1];
	                    break;
	                case 2:
	                    this.$ = yy.prepareProgram($$[$0]);
	                    break;
	                case 3:
	                    this.$ = $$[$0];
	                    break;
	                case 4:
	                    this.$ = $$[$0];
	                    break;
	                case 5:
	                    this.$ = $$[$0];
	                    break;
	                case 6:
	                    this.$ = $$[$0];
	                    break;
	                case 7:
	                    this.$ = $$[$0];
	                    break;
	                case 8:
	                    this.$ = $$[$0];
	                    break;
	                case 9:
	                    this.$ = {
	                        type: 'CommentStatement',
	                        value: yy.stripComment($$[$0]),
	                        strip: yy.stripFlags($$[$0], $$[$0]),
	                        loc: yy.locInfo(this._$)
	                    };

	                    break;
	                case 10:
	                    this.$ = {
	                        type: 'ContentStatement',
	                        original: $$[$0],
	                        value: $$[$0],
	                        loc: yy.locInfo(this._$)
	                    };

	                    break;
	                case 11:
	                    this.$ = yy.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
	                    break;
	                case 12:
	                    this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1] };
	                    break;
	                case 13:
	                    this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
	                    break;
	                case 14:
	                    this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
	                    break;
	                case 15:
	                    this.$ = { open: $$[$0 - 5], path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
	                    break;
	                case 16:
	                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
	                    break;
	                case 17:
	                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
	                    break;
	                case 18:
	                    this.$ = { strip: yy.stripFlags($$[$0 - 1], $$[$0 - 1]), program: $$[$0] };
	                    break;
	                case 19:
	                    var inverse = yy.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$),
	                        program = yy.prepareProgram([inverse], $$[$0 - 1].loc);
	                    program.chained = true;

	                    this.$ = { strip: $$[$0 - 2].strip, program: program, chain: true };

	                    break;
	                case 20:
	                    this.$ = $$[$0];
	                    break;
	                case 21:
	                    this.$ = { path: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 2], $$[$0]) };
	                    break;
	                case 22:
	                    this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
	                    break;
	                case 23:
	                    this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
	                    break;
	                case 24:
	                    this.$ = {
	                        type: 'PartialStatement',
	                        name: $$[$0 - 3],
	                        params: $$[$0 - 2],
	                        hash: $$[$0 - 1],
	                        indent: '',
	                        strip: yy.stripFlags($$[$0 - 4], $$[$0]),
	                        loc: yy.locInfo(this._$)
	                    };

	                    break;
	                case 25:
	                    this.$ = yy.preparePartialBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
	                    break;
	                case 26:
	                    this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 4], $$[$0]) };
	                    break;
	                case 27:
	                    this.$ = $$[$0];
	                    break;
	                case 28:
	                    this.$ = $$[$0];
	                    break;
	                case 29:
	                    this.$ = {
	                        type: 'SubExpression',
	                        path: $$[$0 - 3],
	                        params: $$[$0 - 2],
	                        hash: $$[$0 - 1],
	                        loc: yy.locInfo(this._$)
	                    };

	                    break;
	                case 30:
	                    this.$ = { type: 'Hash', pairs: $$[$0], loc: yy.locInfo(this._$) };
	                    break;
	                case 31:
	                    this.$ = { type: 'HashPair', key: yy.id($$[$0 - 2]), value: $$[$0], loc: yy.locInfo(this._$) };
	                    break;
	                case 32:
	                    this.$ = yy.id($$[$0 - 1]);
	                    break;
	                case 33:
	                    this.$ = $$[$0];
	                    break;
	                case 34:
	                    this.$ = $$[$0];
	                    break;
	                case 35:
	                    this.$ = { type: 'StringLiteral', value: $$[$0], original: $$[$0], loc: yy.locInfo(this._$) };
	                    break;
	                case 36:
	                    this.$ = { type: 'NumberLiteral', value: Number($$[$0]), original: Number($$[$0]), loc: yy.locInfo(this._$) };
	                    break;
	                case 37:
	                    this.$ = { type: 'BooleanLiteral', value: $$[$0] === 'true', original: $$[$0] === 'true', loc: yy.locInfo(this._$) };
	                    break;
	                case 38:
	                    this.$ = { type: 'UndefinedLiteral', original: undefined, value: undefined, loc: yy.locInfo(this._$) };
	                    break;
	                case 39:
	                    this.$ = { type: 'NullLiteral', original: null, value: null, loc: yy.locInfo(this._$) };
	                    break;
	                case 40:
	                    this.$ = $$[$0];
	                    break;
	                case 41:
	                    this.$ = $$[$0];
	                    break;
	                case 42:
	                    this.$ = yy.preparePath(true, $$[$0], this._$);
	                    break;
	                case 43:
	                    this.$ = yy.preparePath(false, $$[$0], this._$);
	                    break;
	                case 44:
	                    $$[$0 - 2].push({ part: yy.id($$[$0]), original: $$[$0], separator: $$[$0 - 1] });this.$ = $$[$0 - 2];
	                    break;
	                case 45:
	                    this.$ = [{ part: yy.id($$[$0]), original: $$[$0] }];
	                    break;
	                case 46:
	                    this.$ = [];
	                    break;
	                case 47:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 48:
	                    this.$ = [];
	                    break;
	                case 49:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 50:
	                    this.$ = [];
	                    break;
	                case 51:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 58:
	                    this.$ = [];
	                    break;
	                case 59:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 64:
	                    this.$ = [];
	                    break;
	                case 65:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 70:
	                    this.$ = [];
	                    break;
	                case 71:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 78:
	                    this.$ = [];
	                    break;
	                case 79:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 82:
	                    this.$ = [];
	                    break;
	                case 83:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 86:
	                    this.$ = [];
	                    break;
	                case 87:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 90:
	                    this.$ = [];
	                    break;
	                case 91:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 94:
	                    this.$ = [];
	                    break;
	                case 95:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 98:
	                    this.$ = [$$[$0]];
	                    break;
	                case 99:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	                case 100:
	                    this.$ = [$$[$0]];
	                    break;
	                case 101:
	                    $$[$0 - 1].push($$[$0]);
	                    break;
	            }
	        },
	        table: [{ 3: 1, 4: 2, 5: [2, 46], 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 1: [3] }, { 5: [1, 4] }, { 5: [2, 2], 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: 11, 14: [1, 12], 15: [1, 20], 16: 17, 19: [1, 23], 24: 15, 27: 16, 29: [1, 21], 34: [1, 22], 39: [2, 2], 44: [2, 2], 47: [2, 2], 48: [1, 13], 51: [1, 14], 55: [1, 18], 59: 19, 60: [1, 24] }, { 1: [2, 1] }, { 5: [2, 47], 14: [2, 47], 15: [2, 47], 19: [2, 47], 29: [2, 47], 34: [2, 47], 39: [2, 47], 44: [2, 47], 47: [2, 47], 48: [2, 47], 51: [2, 47], 55: [2, 47], 60: [2, 47] }, { 5: [2, 3], 14: [2, 3], 15: [2, 3], 19: [2, 3], 29: [2, 3], 34: [2, 3], 39: [2, 3], 44: [2, 3], 47: [2, 3], 48: [2, 3], 51: [2, 3], 55: [2, 3], 60: [2, 3] }, { 5: [2, 4], 14: [2, 4], 15: [2, 4], 19: [2, 4], 29: [2, 4], 34: [2, 4], 39: [2, 4], 44: [2, 4], 47: [2, 4], 48: [2, 4], 51: [2, 4], 55: [2, 4], 60: [2, 4] }, { 5: [2, 5], 14: [2, 5], 15: [2, 5], 19: [2, 5], 29: [2, 5], 34: [2, 5], 39: [2, 5], 44: [2, 5], 47: [2, 5], 48: [2, 5], 51: [2, 5], 55: [2, 5], 60: [2, 5] }, { 5: [2, 6], 14: [2, 6], 15: [2, 6], 19: [2, 6], 29: [2, 6], 34: [2, 6], 39: [2, 6], 44: [2, 6], 47: [2, 6], 48: [2, 6], 51: [2, 6], 55: [2, 6], 60: [2, 6] }, { 5: [2, 7], 14: [2, 7], 15: [2, 7], 19: [2, 7], 29: [2, 7], 34: [2, 7], 39: [2, 7], 44: [2, 7], 47: [2, 7], 48: [2, 7], 51: [2, 7], 55: [2, 7], 60: [2, 7] }, { 5: [2, 8], 14: [2, 8], 15: [2, 8], 19: [2, 8], 29: [2, 8], 34: [2, 8], 39: [2, 8], 44: [2, 8], 47: [2, 8], 48: [2, 8], 51: [2, 8], 55: [2, 8], 60: [2, 8] }, { 5: [2, 9], 14: [2, 9], 15: [2, 9], 19: [2, 9], 29: [2, 9], 34: [2, 9], 39: [2, 9], 44: [2, 9], 47: [2, 9], 48: [2, 9], 51: [2, 9], 55: [2, 9], 60: [2, 9] }, { 20: 25, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 36, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 37, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 39: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 4: 38, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 15: [2, 48], 17: 39, 18: [2, 48] }, { 20: 41, 56: 40, 64: 42, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 44, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 5: [2, 10], 14: [2, 10], 15: [2, 10], 18: [2, 10], 19: [2, 10], 29: [2, 10], 34: [2, 10], 39: [2, 10], 44: [2, 10], 47: [2, 10], 48: [2, 10], 51: [2, 10], 55: [2, 10], 60: [2, 10] }, { 20: 45, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 46, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 47, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 41, 56: 48, 64: 42, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [2, 78], 49: 49, 65: [2, 78], 72: [2, 78], 80: [2, 78], 81: [2, 78], 82: [2, 78], 83: [2, 78], 84: [2, 78], 85: [2, 78] }, { 23: [2, 33], 33: [2, 33], 54: [2, 33], 65: [2, 33], 68: [2, 33], 72: [2, 33], 75: [2, 33], 80: [2, 33], 81: [2, 33], 82: [2, 33], 83: [2, 33], 84: [2, 33], 85: [2, 33] }, { 23: [2, 34], 33: [2, 34], 54: [2, 34], 65: [2, 34], 68: [2, 34], 72: [2, 34], 75: [2, 34], 80: [2, 34], 81: [2, 34], 82: [2, 34], 83: [2, 34], 84: [2, 34], 85: [2, 34] }, { 23: [2, 35], 33: [2, 35], 54: [2, 35], 65: [2, 35], 68: [2, 35], 72: [2, 35], 75: [2, 35], 80: [2, 35], 81: [2, 35], 82: [2, 35], 83: [2, 35], 84: [2, 35], 85: [2, 35] }, { 23: [2, 36], 33: [2, 36], 54: [2, 36], 65: [2, 36], 68: [2, 36], 72: [2, 36], 75: [2, 36], 80: [2, 36], 81: [2, 36], 82: [2, 36], 83: [2, 36], 84: [2, 36], 85: [2, 36] }, { 23: [2, 37], 33: [2, 37], 54: [2, 37], 65: [2, 37], 68: [2, 37], 72: [2, 37], 75: [2, 37], 80: [2, 37], 81: [2, 37], 82: [2, 37], 83: [2, 37], 84: [2, 37], 85: [2, 37] }, { 23: [2, 38], 33: [2, 38], 54: [2, 38], 65: [2, 38], 68: [2, 38], 72: [2, 38], 75: [2, 38], 80: [2, 38], 81: [2, 38], 82: [2, 38], 83: [2, 38], 84: [2, 38], 85: [2, 38] }, { 23: [2, 39], 33: [2, 39], 54: [2, 39], 65: [2, 39], 68: [2, 39], 72: [2, 39], 75: [2, 39], 80: [2, 39], 81: [2, 39], 82: [2, 39], 83: [2, 39], 84: [2, 39], 85: [2, 39] }, { 23: [2, 43], 33: [2, 43], 54: [2, 43], 65: [2, 43], 68: [2, 43], 72: [2, 43], 75: [2, 43], 80: [2, 43], 81: [2, 43], 82: [2, 43], 83: [2, 43], 84: [2, 43], 85: [2, 43], 87: [1, 50] }, { 72: [1, 35], 86: 51 }, { 23: [2, 45], 33: [2, 45], 54: [2, 45], 65: [2, 45], 68: [2, 45], 72: [2, 45], 75: [2, 45], 80: [2, 45], 81: [2, 45], 82: [2, 45], 83: [2, 45], 84: [2, 45], 85: [2, 45], 87: [2, 45] }, { 52: 52, 54: [2, 82], 65: [2, 82], 72: [2, 82], 80: [2, 82], 81: [2, 82], 82: [2, 82], 83: [2, 82], 84: [2, 82], 85: [2, 82] }, { 25: 53, 38: 55, 39: [1, 57], 43: 56, 44: [1, 58], 45: 54, 47: [2, 54] }, { 28: 59, 43: 60, 44: [1, 58], 47: [2, 56] }, { 13: 62, 15: [1, 20], 18: [1, 61] }, { 33: [2, 86], 57: 63, 65: [2, 86], 72: [2, 86], 80: [2, 86], 81: [2, 86], 82: [2, 86], 83: [2, 86], 84: [2, 86], 85: [2, 86] }, { 33: [2, 40], 65: [2, 40], 72: [2, 40], 80: [2, 40], 81: [2, 40], 82: [2, 40], 83: [2, 40], 84: [2, 40], 85: [2, 40] }, { 33: [2, 41], 65: [2, 41], 72: [2, 41], 80: [2, 41], 81: [2, 41], 82: [2, 41], 83: [2, 41], 84: [2, 41], 85: [2, 41] }, { 20: 64, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 26: 65, 47: [1, 66] }, { 30: 67, 33: [2, 58], 65: [2, 58], 72: [2, 58], 75: [2, 58], 80: [2, 58], 81: [2, 58], 82: [2, 58], 83: [2, 58], 84: [2, 58], 85: [2, 58] }, { 33: [2, 64], 35: 68, 65: [2, 64], 72: [2, 64], 75: [2, 64], 80: [2, 64], 81: [2, 64], 82: [2, 64], 83: [2, 64], 84: [2, 64], 85: [2, 64] }, { 21: 69, 23: [2, 50], 65: [2, 50], 72: [2, 50], 80: [2, 50], 81: [2, 50], 82: [2, 50], 83: [2, 50], 84: [2, 50], 85: [2, 50] }, { 33: [2, 90], 61: 70, 65: [2, 90], 72: [2, 90], 80: [2, 90], 81: [2, 90], 82: [2, 90], 83: [2, 90], 84: [2, 90], 85: [2, 90] }, { 20: 74, 33: [2, 80], 50: 71, 63: 72, 64: 75, 65: [1, 43], 69: 73, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 72: [1, 79] }, { 23: [2, 42], 33: [2, 42], 54: [2, 42], 65: [2, 42], 68: [2, 42], 72: [2, 42], 75: [2, 42], 80: [2, 42], 81: [2, 42], 82: [2, 42], 83: [2, 42], 84: [2, 42], 85: [2, 42], 87: [1, 50] }, { 20: 74, 53: 80, 54: [2, 84], 63: 81, 64: 75, 65: [1, 43], 69: 82, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 26: 83, 47: [1, 66] }, { 47: [2, 55] }, { 4: 84, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 39: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 47: [2, 20] }, { 20: 85, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 86, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 26: 87, 47: [1, 66] }, { 47: [2, 57] }, { 5: [2, 11], 14: [2, 11], 15: [2, 11], 19: [2, 11], 29: [2, 11], 34: [2, 11], 39: [2, 11], 44: [2, 11], 47: [2, 11], 48: [2, 11], 51: [2, 11], 55: [2, 11], 60: [2, 11] }, { 15: [2, 49], 18: [2, 49] }, { 20: 74, 33: [2, 88], 58: 88, 63: 89, 64: 75, 65: [1, 43], 69: 90, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 65: [2, 94], 66: 91, 68: [2, 94], 72: [2, 94], 80: [2, 94], 81: [2, 94], 82: [2, 94], 83: [2, 94], 84: [2, 94], 85: [2, 94] }, { 5: [2, 25], 14: [2, 25], 15: [2, 25], 19: [2, 25], 29: [2, 25], 34: [2, 25], 39: [2, 25], 44: [2, 25], 47: [2, 25], 48: [2, 25], 51: [2, 25], 55: [2, 25], 60: [2, 25] }, { 20: 92, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 31: 93, 33: [2, 60], 63: 94, 64: 75, 65: [1, 43], 69: 95, 70: 76, 71: 77, 72: [1, 78], 75: [2, 60], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 33: [2, 66], 36: 96, 63: 97, 64: 75, 65: [1, 43], 69: 98, 70: 76, 71: 77, 72: [1, 78], 75: [2, 66], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 22: 99, 23: [2, 52], 63: 100, 64: 75, 65: [1, 43], 69: 101, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 33: [2, 92], 62: 102, 63: 103, 64: 75, 65: [1, 43], 69: 104, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [1, 105] }, { 33: [2, 79], 65: [2, 79], 72: [2, 79], 80: [2, 79], 81: [2, 79], 82: [2, 79], 83: [2, 79], 84: [2, 79], 85: [2, 79] }, { 33: [2, 81] }, { 23: [2, 27], 33: [2, 27], 54: [2, 27], 65: [2, 27], 68: [2, 27], 72: [2, 27], 75: [2, 27], 80: [2, 27], 81: [2, 27], 82: [2, 27], 83: [2, 27], 84: [2, 27], 85: [2, 27] }, { 23: [2, 28], 33: [2, 28], 54: [2, 28], 65: [2, 28], 68: [2, 28], 72: [2, 28], 75: [2, 28], 80: [2, 28], 81: [2, 28], 82: [2, 28], 83: [2, 28], 84: [2, 28], 85: [2, 28] }, { 23: [2, 30], 33: [2, 30], 54: [2, 30], 68: [2, 30], 71: 106, 72: [1, 107], 75: [2, 30] }, { 23: [2, 98], 33: [2, 98], 54: [2, 98], 68: [2, 98], 72: [2, 98], 75: [2, 98] }, { 23: [2, 45], 33: [2, 45], 54: [2, 45], 65: [2, 45], 68: [2, 45], 72: [2, 45], 73: [1, 108], 75: [2, 45], 80: [2, 45], 81: [2, 45], 82: [2, 45], 83: [2, 45], 84: [2, 45], 85: [2, 45], 87: [2, 45] }, { 23: [2, 44], 33: [2, 44], 54: [2, 44], 65: [2, 44], 68: [2, 44], 72: [2, 44], 75: [2, 44], 80: [2, 44], 81: [2, 44], 82: [2, 44], 83: [2, 44], 84: [2, 44], 85: [2, 44], 87: [2, 44] }, { 54: [1, 109] }, { 54: [2, 83], 65: [2, 83], 72: [2, 83], 80: [2, 83], 81: [2, 83], 82: [2, 83], 83: [2, 83], 84: [2, 83], 85: [2, 83] }, { 54: [2, 85] }, { 5: [2, 13], 14: [2, 13], 15: [2, 13], 19: [2, 13], 29: [2, 13], 34: [2, 13], 39: [2, 13], 44: [2, 13], 47: [2, 13], 48: [2, 13], 51: [2, 13], 55: [2, 13], 60: [2, 13] }, { 38: 55, 39: [1, 57], 43: 56, 44: [1, 58], 45: 111, 46: 110, 47: [2, 76] }, { 33: [2, 70], 40: 112, 65: [2, 70], 72: [2, 70], 75: [2, 70], 80: [2, 70], 81: [2, 70], 82: [2, 70], 83: [2, 70], 84: [2, 70], 85: [2, 70] }, { 47: [2, 18] }, { 5: [2, 14], 14: [2, 14], 15: [2, 14], 19: [2, 14], 29: [2, 14], 34: [2, 14], 39: [2, 14], 44: [2, 14], 47: [2, 14], 48: [2, 14], 51: [2, 14], 55: [2, 14], 60: [2, 14] }, { 33: [1, 113] }, { 33: [2, 87], 65: [2, 87], 72: [2, 87], 80: [2, 87], 81: [2, 87], 82: [2, 87], 83: [2, 87], 84: [2, 87], 85: [2, 87] }, { 33: [2, 89] }, { 20: 74, 63: 115, 64: 75, 65: [1, 43], 67: 114, 68: [2, 96], 69: 116, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [1, 117] }, { 32: 118, 33: [2, 62], 74: 119, 75: [1, 120] }, { 33: [2, 59], 65: [2, 59], 72: [2, 59], 75: [2, 59], 80: [2, 59], 81: [2, 59], 82: [2, 59], 83: [2, 59], 84: [2, 59], 85: [2, 59] }, { 33: [2, 61], 75: [2, 61] }, { 33: [2, 68], 37: 121, 74: 122, 75: [1, 120] }, { 33: [2, 65], 65: [2, 65], 72: [2, 65], 75: [2, 65], 80: [2, 65], 81: [2, 65], 82: [2, 65], 83: [2, 65], 84: [2, 65], 85: [2, 65] }, { 33: [2, 67], 75: [2, 67] }, { 23: [1, 123] }, { 23: [2, 51], 65: [2, 51], 72: [2, 51], 80: [2, 51], 81: [2, 51], 82: [2, 51], 83: [2, 51], 84: [2, 51], 85: [2, 51] }, { 23: [2, 53] }, { 33: [1, 124] }, { 33: [2, 91], 65: [2, 91], 72: [2, 91], 80: [2, 91], 81: [2, 91], 82: [2, 91], 83: [2, 91], 84: [2, 91], 85: [2, 91] }, { 33: [2, 93] }, { 5: [2, 22], 14: [2, 22], 15: [2, 22], 19: [2, 22], 29: [2, 22], 34: [2, 22], 39: [2, 22], 44: [2, 22], 47: [2, 22], 48: [2, 22], 51: [2, 22], 55: [2, 22], 60: [2, 22] }, { 23: [2, 99], 33: [2, 99], 54: [2, 99], 68: [2, 99], 72: [2, 99], 75: [2, 99] }, { 73: [1, 108] }, { 20: 74, 63: 125, 64: 75, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 5: [2, 23], 14: [2, 23], 15: [2, 23], 19: [2, 23], 29: [2, 23], 34: [2, 23], 39: [2, 23], 44: [2, 23], 47: [2, 23], 48: [2, 23], 51: [2, 23], 55: [2, 23], 60: [2, 23] }, { 47: [2, 19] }, { 47: [2, 77] }, { 20: 74, 33: [2, 72], 41: 126, 63: 127, 64: 75, 65: [1, 43], 69: 128, 70: 76, 71: 77, 72: [1, 78], 75: [2, 72], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 5: [2, 24], 14: [2, 24], 15: [2, 24], 19: [2, 24], 29: [2, 24], 34: [2, 24], 39: [2, 24], 44: [2, 24], 47: [2, 24], 48: [2, 24], 51: [2, 24], 55: [2, 24], 60: [2, 24] }, { 68: [1, 129] }, { 65: [2, 95], 68: [2, 95], 72: [2, 95], 80: [2, 95], 81: [2, 95], 82: [2, 95], 83: [2, 95], 84: [2, 95], 85: [2, 95] }, { 68: [2, 97] }, { 5: [2, 21], 14: [2, 21], 15: [2, 21], 19: [2, 21], 29: [2, 21], 34: [2, 21], 39: [2, 21], 44: [2, 21], 47: [2, 21], 48: [2, 21], 51: [2, 21], 55: [2, 21], 60: [2, 21] }, { 33: [1, 130] }, { 33: [2, 63] }, { 72: [1, 132], 76: 131 }, { 33: [1, 133] }, { 33: [2, 69] }, { 15: [2, 12], 18: [2, 12] }, { 14: [2, 26], 15: [2, 26], 19: [2, 26], 29: [2, 26], 34: [2, 26], 47: [2, 26], 48: [2, 26], 51: [2, 26], 55: [2, 26], 60: [2, 26] }, { 23: [2, 31], 33: [2, 31], 54: [2, 31], 68: [2, 31], 72: [2, 31], 75: [2, 31] }, { 33: [2, 74], 42: 134, 74: 135, 75: [1, 120] }, { 33: [2, 71], 65: [2, 71], 72: [2, 71], 75: [2, 71], 80: [2, 71], 81: [2, 71], 82: [2, 71], 83: [2, 71], 84: [2, 71], 85: [2, 71] }, { 33: [2, 73], 75: [2, 73] }, { 23: [2, 29], 33: [2, 29], 54: [2, 29], 65: [2, 29], 68: [2, 29], 72: [2, 29], 75: [2, 29], 80: [2, 29], 81: [2, 29], 82: [2, 29], 83: [2, 29], 84: [2, 29], 85: [2, 29] }, { 14: [2, 15], 15: [2, 15], 19: [2, 15], 29: [2, 15], 34: [2, 15], 39: [2, 15], 44: [2, 15], 47: [2, 15], 48: [2, 15], 51: [2, 15], 55: [2, 15], 60: [2, 15] }, { 72: [1, 137], 77: [1, 136] }, { 72: [2, 100], 77: [2, 100] }, { 14: [2, 16], 15: [2, 16], 19: [2, 16], 29: [2, 16], 34: [2, 16], 44: [2, 16], 47: [2, 16], 48: [2, 16], 51: [2, 16], 55: [2, 16], 60: [2, 16] }, { 33: [1, 138] }, { 33: [2, 75] }, { 33: [2, 32] }, { 72: [2, 101], 77: [2, 101] }, { 14: [2, 17], 15: [2, 17], 19: [2, 17], 29: [2, 17], 34: [2, 17], 39: [2, 17], 44: [2, 17], 47: [2, 17], 48: [2, 17], 51: [2, 17], 55: [2, 17], 60: [2, 17] }],
	        defaultActions: { 4: [2, 1], 54: [2, 55], 56: [2, 20], 60: [2, 57], 73: [2, 81], 82: [2, 85], 86: [2, 18], 90: [2, 89], 101: [2, 53], 104: [2, 93], 110: [2, 19], 111: [2, 77], 116: [2, 97], 119: [2, 63], 122: [2, 69], 135: [2, 75], 136: [2, 32] },
	        parseError: function parseError(str, hash) {
	            throw new Error(str);
	        },
	        parse: function parse(input) {
	            var self = this,
	                stack = [0],
	                vstack = [null],
	                lstack = [],
	                table = this.table,
	                yytext = "",
	                yylineno = 0,
	                yyleng = 0,
	                recovering = 0,
	                TERROR = 2,
	                EOF = 1;
	            this.lexer.setInput(input);
	            this.lexer.yy = this.yy;
	            this.yy.lexer = this.lexer;
	            this.yy.parser = this;
	            if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
	            var yyloc = this.lexer.yylloc;
	            lstack.push(yyloc);
	            var ranges = this.lexer.options && this.lexer.options.ranges;
	            if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
	            function popStack(n) {
	                stack.length = stack.length - 2 * n;
	                vstack.length = vstack.length - n;
	                lstack.length = lstack.length - n;
	            }
	            function lex() {
	                var token;
	                token = self.lexer.lex() || 1;
	                if (typeof token !== "number") {
	                    token = self.symbols_[token] || token;
	                }
	                return token;
	            }
	            var symbol,
	                preErrorSymbol,
	                state,
	                action,
	                a,
	                r,
	                yyval = {},
	                p,
	                len,
	                newState,
	                expected;
	            while (true) {
	                state = stack[stack.length - 1];
	                if (this.defaultActions[state]) {
	                    action = this.defaultActions[state];
	                } else {
	                    if (symbol === null || typeof symbol == "undefined") {
	                        symbol = lex();
	                    }
	                    action = table[state] && table[state][symbol];
	                }
	                if (typeof action === "undefined" || !action.length || !action[0]) {
	                    var errStr = "";
	                    if (!recovering) {
	                        expected = [];
	                        for (p in table[state]) if (this.terminals_[p] && p > 2) {
	                            expected.push("'" + this.terminals_[p] + "'");
	                        }
	                        if (this.lexer.showPosition) {
	                            errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
	                        } else {
	                            errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
	                        }
	                        this.parseError(errStr, { text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected });
	                    }
	                }
	                if (action[0] instanceof Array && action.length > 1) {
	                    throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
	                }
	                switch (action[0]) {
	                    case 1:
	                        stack.push(symbol);
	                        vstack.push(this.lexer.yytext);
	                        lstack.push(this.lexer.yylloc);
	                        stack.push(action[1]);
	                        symbol = null;
	                        if (!preErrorSymbol) {
	                            yyleng = this.lexer.yyleng;
	                            yytext = this.lexer.yytext;
	                            yylineno = this.lexer.yylineno;
	                            yyloc = this.lexer.yylloc;
	                            if (recovering > 0) recovering--;
	                        } else {
	                            symbol = preErrorSymbol;
	                            preErrorSymbol = null;
	                        }
	                        break;
	                    case 2:
	                        len = this.productions_[action[1]][1];
	                        yyval.$ = vstack[vstack.length - len];
	                        yyval._$ = { first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column };
	                        if (ranges) {
	                            yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
	                        }
	                        r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
	                        if (typeof r !== "undefined") {
	                            return r;
	                        }
	                        if (len) {
	                            stack = stack.slice(0, -1 * len * 2);
	                            vstack = vstack.slice(0, -1 * len);
	                            lstack = lstack.slice(0, -1 * len);
	                        }
	                        stack.push(this.productions_[action[1]][0]);
	                        vstack.push(yyval.$);
	                        lstack.push(yyval._$);
	                        newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
	                        stack.push(newState);
	                        break;
	                    case 3:
	                        return true;
	                }
	            }
	            return true;
	        }
	    };
	    /* Jison generated lexer */
	    var lexer = (function () {
	        var lexer = { EOF: 1,
	            parseError: function parseError(str, hash) {
	                if (this.yy.parser) {
	                    this.yy.parser.parseError(str, hash);
	                } else {
	                    throw new Error(str);
	                }
	            },
	            setInput: function setInput(input) {
	                this._input = input;
	                this._more = this._less = this.done = false;
	                this.yylineno = this.yyleng = 0;
	                this.yytext = this.matched = this.match = '';
	                this.conditionStack = ['INITIAL'];
	                this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 };
	                if (this.options.ranges) this.yylloc.range = [0, 0];
	                this.offset = 0;
	                return this;
	            },
	            input: function input() {
	                var ch = this._input[0];
	                this.yytext += ch;
	                this.yyleng++;
	                this.offset++;
	                this.match += ch;
	                this.matched += ch;
	                var lines = ch.match(/(?:\r\n?|\n).*/g);
	                if (lines) {
	                    this.yylineno++;
	                    this.yylloc.last_line++;
	                } else {
	                    this.yylloc.last_column++;
	                }
	                if (this.options.ranges) this.yylloc.range[1]++;

	                this._input = this._input.slice(1);
	                return ch;
	            },
	            unput: function unput(ch) {
	                var len = ch.length;
	                var lines = ch.split(/(?:\r\n?|\n)/g);

	                this._input = ch + this._input;
	                this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
	                //this.yyleng -= len;
	                this.offset -= len;
	                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
	                this.match = this.match.substr(0, this.match.length - 1);
	                this.matched = this.matched.substr(0, this.matched.length - 1);

	                if (lines.length - 1) this.yylineno -= lines.length - 1;
	                var r = this.yylloc.range;

	                this.yylloc = { first_line: this.yylloc.first_line,
	                    last_line: this.yylineno + 1,
	                    first_column: this.yylloc.first_column,
	                    last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
	                };

	                if (this.options.ranges) {
	                    this.yylloc.range = [r[0], r[0] + this.yyleng - len];
	                }
	                return this;
	            },
	            more: function more() {
	                this._more = true;
	                return this;
	            },
	            less: function less(n) {
	                this.unput(this.match.slice(n));
	            },
	            pastInput: function pastInput() {
	                var past = this.matched.substr(0, this.matched.length - this.match.length);
	                return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
	            },
	            upcomingInput: function upcomingInput() {
	                var next = this.match;
	                if (next.length < 20) {
	                    next += this._input.substr(0, 20 - next.length);
	                }
	                return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
	            },
	            showPosition: function showPosition() {
	                var pre = this.pastInput();
	                var c = new Array(pre.length + 1).join("-");
	                return pre + this.upcomingInput() + "\n" + c + "^";
	            },
	            next: function next() {
	                if (this.done) {
	                    return this.EOF;
	                }
	                if (!this._input) this.done = true;

	                var token, match, tempMatch, index, col, lines;
	                if (!this._more) {
	                    this.yytext = '';
	                    this.match = '';
	                }
	                var rules = this._currentRules();
	                for (var i = 0; i < rules.length; i++) {
	                    tempMatch = this._input.match(this.rules[rules[i]]);
	                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
	                        match = tempMatch;
	                        index = i;
	                        if (!this.options.flex) break;
	                    }
	                }
	                if (match) {
	                    lines = match[0].match(/(?:\r\n?|\n).*/g);
	                    if (lines) this.yylineno += lines.length;
	                    this.yylloc = { first_line: this.yylloc.last_line,
	                        last_line: this.yylineno + 1,
	                        first_column: this.yylloc.last_column,
	                        last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length };
	                    this.yytext += match[0];
	                    this.match += match[0];
	                    this.matches = match;
	                    this.yyleng = this.yytext.length;
	                    if (this.options.ranges) {
	                        this.yylloc.range = [this.offset, this.offset += this.yyleng];
	                    }
	                    this._more = false;
	                    this._input = this._input.slice(match[0].length);
	                    this.matched += match[0];
	                    token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
	                    if (this.done && this._input) this.done = false;
	                    if (token) return token;else return;
	                }
	                if (this._input === "") {
	                    return this.EOF;
	                } else {
	                    return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), { text: "", token: null, line: this.yylineno });
	                }
	            },
	            lex: function lex() {
	                var r = this.next();
	                if (typeof r !== 'undefined') {
	                    return r;
	                } else {
	                    return this.lex();
	                }
	            },
	            begin: function begin(condition) {
	                this.conditionStack.push(condition);
	            },
	            popState: function popState() {
	                return this.conditionStack.pop();
	            },
	            _currentRules: function _currentRules() {
	                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
	            },
	            topState: function topState() {
	                return this.conditionStack[this.conditionStack.length - 2];
	            },
	            pushState: function begin(condition) {
	                this.begin(condition);
	            } };
	        lexer.options = {};
	        lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

	            function strip(start, end) {
	                return yy_.yytext = yy_.yytext.substring(start, yy_.yyleng - end + start);
	            }

	            var YYSTATE = YY_START;
	            switch ($avoiding_name_collisions) {
	                case 0:
	                    if (yy_.yytext.slice(-2) === "\\\\") {
	                        strip(0, 1);
	                        this.begin("mu");
	                    } else if (yy_.yytext.slice(-1) === "\\") {
	                        strip(0, 1);
	                        this.begin("emu");
	                    } else {
	                        this.begin("mu");
	                    }
	                    if (yy_.yytext) return 15;

	                    break;
	                case 1:
	                    return 15;
	                    break;
	                case 2:
	                    this.popState();
	                    return 15;

	                    break;
	                case 3:
	                    this.begin('raw');return 15;
	                    break;
	                case 4:
	                    this.popState();
	                    // Should be using `this.topState()` below, but it currently
	                    // returns the second top instead of the first top. Opened an
	                    // issue about it at https://github.com/zaach/jison/issues/291
	                    if (this.conditionStack[this.conditionStack.length - 1] === 'raw') {
	                        return 15;
	                    } else {
	                        strip(5, 9);
	                        return 'END_RAW_BLOCK';
	                    }

	                    break;
	                case 5:
	                    return 15;
	                    break;
	                case 6:
	                    this.popState();
	                    return 14;

	                    break;
	                case 7:
	                    return 65;
	                    break;
	                case 8:
	                    return 68;
	                    break;
	                case 9:
	                    return 19;
	                    break;
	                case 10:
	                    this.popState();
	                    this.begin('raw');
	                    return 23;

	                    break;
	                case 11:
	                    return 55;
	                    break;
	                case 12:
	                    return 60;
	                    break;
	                case 13:
	                    return 29;
	                    break;
	                case 14:
	                    return 47;
	                    break;
	                case 15:
	                    this.popState();return 44;
	                    break;
	                case 16:
	                    this.popState();return 44;
	                    break;
	                case 17:
	                    return 34;
	                    break;
	                case 18:
	                    return 39;
	                    break;
	                case 19:
	                    return 51;
	                    break;
	                case 20:
	                    return 48;
	                    break;
	                case 21:
	                    this.unput(yy_.yytext);
	                    this.popState();
	                    this.begin('com');

	                    break;
	                case 22:
	                    this.popState();
	                    return 14;

	                    break;
	                case 23:
	                    return 48;
	                    break;
	                case 24:
	                    return 73;
	                    break;
	                case 25:
	                    return 72;
	                    break;
	                case 26:
	                    return 72;
	                    break;
	                case 27:
	                    return 87;
	                    break;
	                case 28:
	                    // ignore whitespace
	                    break;
	                case 29:
	                    this.popState();return 54;
	                    break;
	                case 30:
	                    this.popState();return 33;
	                    break;
	                case 31:
	                    yy_.yytext = strip(1, 2).replace(/\\"/g, '"');return 80;
	                    break;
	                case 32:
	                    yy_.yytext = strip(1, 2).replace(/\\'/g, "'");return 80;
	                    break;
	                case 33:
	                    return 85;
	                    break;
	                case 34:
	                    return 82;
	                    break;
	                case 35:
	                    return 82;
	                    break;
	                case 36:
	                    return 83;
	                    break;
	                case 37:
	                    return 84;
	                    break;
	                case 38:
	                    return 81;
	                    break;
	                case 39:
	                    return 75;
	                    break;
	                case 40:
	                    return 77;
	                    break;
	                case 41:
	                    return 72;
	                    break;
	                case 42:
	                    yy_.yytext = yy_.yytext.replace(/\\([\\\]])/g, '$1');return 72;
	                    break;
	                case 43:
	                    return 'INVALID';
	                    break;
	                case 44:
	                    return 5;
	                    break;
	            }
	        };
	        lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{(?=[^\/]))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]+?(?=(\{\{\{\{)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#>)/, /^(?:\{\{(~)?#\*?)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?\*?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[(\\\]|[^\]])*\])/, /^(?:.)/, /^(?:$)/];
	        lexer.conditions = { "mu": { "rules": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44], "inclusive": false }, "emu": { "rules": [2], "inclusive": false }, "com": { "rules": [6], "inclusive": false }, "raw": { "rules": [3, 4, 5], "inclusive": false }, "INITIAL": { "rules": [0, 1, 44], "inclusive": true } };
	        return lexer;
	    })();
	    parser.lexer = lexer;
	    
	    function Parser() {
	        this.yy = {};
	    }
	    
	    Parser.prototype = parser;
	    parser.Parser = Parser;
	    return new Parser();
	})();

	return handlebars;

});
define('skylark-handlebars/compiler/visitor',['../exception'], function (Exception) {
    'use strict';
    function Visitor() {
        this.parents = [];
    }
    Visitor.prototype = {
        constructor: Visitor,
        mutating: false,
        acceptKey: function (node, name) {
            let value = this.accept(node[name]);
            if (this.mutating) {
                if (value && !Visitor.prototype[value.type]) {
                    throw new Exception('Unexpected node type "' + value.type + '" found when accepting ' + name + ' on ' + node.type);
                }
                node[name] = value;
            }
        },
        acceptRequired: function (node, name) {
            this.acceptKey(node, name);
            if (!node[name]) {
                throw new Exception(node.type + ' requires ' + name);
            }
        },
        acceptArray: function (array) {
            for (let i = 0, l = array.length; i < l; i++) {
                this.acceptKey(array, i);
                if (!array[i]) {
                    array.splice(i, 1);
                    i--;
                    l--;
                }
            }
        },
        accept: function (object) {
            if (!object) {
                return;
            }
            if (!this[object.type]) {
                throw new Exception('Unknown type: ' + object.type, object);
            }
            if (this.current) {
                this.parents.unshift(this.current);
            }
            this.current = object;
            let ret = this[object.type](object);
            this.current = this.parents.shift();
            if (!this.mutating || ret) {
                return ret;
            } else if (ret !== false) {
                return object;
            }
        },
        Program: function (program) {
            this.acceptArray(program.body);
        },
        MustacheStatement: visitSubExpression,
        Decorator: visitSubExpression,
        BlockStatement: visitBlock,
        DecoratorBlock: visitBlock,
        PartialStatement: visitPartial,
        PartialBlockStatement: function (partial) {
            visitPartial.call(this, partial);
            this.acceptKey(partial, 'program');
        },
        ContentStatement: function () {
        },
        CommentStatement: function () {
        },
        SubExpression: visitSubExpression,
        PathExpression: function () {
        },
        StringLiteral: function () {
        },
        NumberLiteral: function () {
        },
        BooleanLiteral: function () {
        },
        UndefinedLiteral: function () {
        },
        NullLiteral: function () {
        },
        Hash: function (hash) {
            this.acceptArray(hash.pairs);
        },
        HashPair: function (pair) {
            this.acceptRequired(pair, 'value');
        }
    };
    function visitSubExpression(mustache) {
        this.acceptRequired(mustache, 'path');
        this.acceptArray(mustache.params);
        this.acceptKey(mustache, 'hash');
    }
    function visitBlock(block) {
        visitSubExpression.call(this, block);
        this.acceptKey(block, 'program');
        this.acceptKey(block, 'inverse');
    }
    function visitPartial(partial) {
        this.acceptRequired(partial, 'name');
        this.acceptArray(partial.params);
        this.acceptKey(partial, 'hash');
    }
    return Visitor;
});
define('skylark-handlebars/compiler/whitespace-control',['./visitor'], function (Visitor) {
    'use strict';
    function WhitespaceControl(options = {}) {
        this.options = options;
    }
    WhitespaceControl.prototype = new Visitor();
    WhitespaceControl.prototype.Program = function (program) {
        const doStandalone = !this.options.ignoreStandalone;
        let isRoot = !this.isRootSeen;
        this.isRootSeen = true;
        let body = program.body;
        for (let i = 0, l = body.length; i < l; i++) {
            let current = body[i], strip = this.accept(current);
            if (!strip) {
                continue;
            }
            let _isPrevWhitespace = isPrevWhitespace(body, i, isRoot), _isNextWhitespace = isNextWhitespace(body, i, isRoot), openStandalone = strip.openStandalone && _isPrevWhitespace, closeStandalone = strip.closeStandalone && _isNextWhitespace, inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;
            if (strip.close) {
                omitRight(body, i, true);
            }
            if (strip.open) {
                omitLeft(body, i, true);
            }
            if (doStandalone && inlineStandalone) {
                omitRight(body, i);
                if (omitLeft(body, i)) {
                    if (current.type === 'PartialStatement') {
                        current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
                    }
                }
            }
            if (doStandalone && openStandalone) {
                omitRight((current.program || current.inverse).body);
                omitLeft(body, i);
            }
            if (doStandalone && closeStandalone) {
                omitRight(body, i);
                omitLeft((current.inverse || current.program).body);
            }
        }
        return program;
    };
    WhitespaceControl.prototype.BlockStatement = WhitespaceControl.prototype.DecoratorBlock = WhitespaceControl.prototype.PartialBlockStatement = function (block) {
        this.accept(block.program);
        this.accept(block.inverse);
        let program = block.program || block.inverse, inverse = block.program && block.inverse, firstInverse = inverse, lastInverse = inverse;
        if (inverse && inverse.chained) {
            firstInverse = inverse.body[0].program;
            while (lastInverse.chained) {
                lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
            }
        }
        let strip = {
            open: block.openStrip.open,
            close: block.closeStrip.close,
            openStandalone: isNextWhitespace(program.body),
            closeStandalone: isPrevWhitespace((firstInverse || program).body)
        };
        if (block.openStrip.close) {
            omitRight(program.body, null, true);
        }
        if (inverse) {
            let inverseStrip = block.inverseStrip;
            if (inverseStrip.open) {
                omitLeft(program.body, null, true);
            }
            if (inverseStrip.close) {
                omitRight(firstInverse.body, null, true);
            }
            if (block.closeStrip.open) {
                omitLeft(lastInverse.body, null, true);
            }
            if (!this.options.ignoreStandalone && isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
                omitLeft(program.body);
                omitRight(firstInverse.body);
            }
        } else if (block.closeStrip.open) {
            omitLeft(program.body, null, true);
        }
        return strip;
    };
    WhitespaceControl.prototype.Decorator = WhitespaceControl.prototype.MustacheStatement = function (mustache) {
        return mustache.strip;
    };
    WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function (node) {
        let strip = node.strip || {};
        return {
            inlineStandalone: true,
            open: strip.open,
            close: strip.close
        };
    };
    function isPrevWhitespace(body, i, isRoot) {
        if (i === undefined) {
            i = body.length;
        }
        let prev = body[i - 1], sibling = body[i - 2];
        if (!prev) {
            return isRoot;
        }
        if (prev.type === 'ContentStatement') {
            return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
        }
    }
    function isNextWhitespace(body, i, isRoot) {
        if (i === undefined) {
            i = -1;
        }
        let next = body[i + 1], sibling = body[i + 2];
        if (!next) {
            return isRoot;
        }
        if (next.type === 'ContentStatement') {
            return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
        }
    }
    function omitRight(body, i, multiple) {
        let current = body[i == null ? 0 : i + 1];
        if (!current || current.type !== 'ContentStatement' || !multiple && current.rightStripped) {
            return;
        }
        let original = current.value;
        current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, '');
        current.rightStripped = current.value !== original;
    }
    function omitLeft(body, i, multiple) {
        let current = body[i == null ? body.length - 1 : i - 1];
        if (!current || current.type !== 'ContentStatement' || !multiple && current.leftStripped) {
            return;
        }
        let original = current.value;
        current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, '');
        current.leftStripped = current.value !== original;
        return current.leftStripped;
    }
    return WhitespaceControl;
});
define('skylark-handlebars/compiler/helpers',['../exception'], function (Exception) {
    'use strict';
    function validateClose(open, close) {
        close = close.path ? close.path.original : close;
        if (open.path.original !== close) {
            let errorNode = { loc: open.path.loc };
            throw new Exception(open.path.original + " doesn't match " + close, errorNode);
        }
    }
    function SourceLocation(source, locInfo) {
        this.source = source;
        this.start = {
            line: locInfo.first_line,
            column: locInfo.first_column
        };
        this.end = {
            line: locInfo.last_line,
            column: locInfo.last_column
        };
    }
    function id(token) {
        if (/^\[.*\]$/.test(token)) {
            return token.substring(1, token.length - 1);
        } else {
            return token;
        }
    }
    function stripFlags(open, close) {
        return {
            open: open.charAt(2) === '~',
            close: close.charAt(close.length - 3) === '~'
        };
    }
    function stripComment(comment) {
        return comment.replace(/^\{\{~?!-?-?/, '').replace(/-?-?~?\}\}$/, '');
    }
    function preparePath(data, parts, loc) {
        loc = this.locInfo(loc);
        let original = data ? '@' : '', dig = [], depth = 0;
        for (let i = 0, l = parts.length; i < l; i++) {
            let part = parts[i].part, isLiteral = parts[i].original !== part;
            original += (parts[i].separator || '') + part;
            if (!isLiteral && (part === '..' || part === '.' || part === 'this')) {
                if (dig.length > 0) {
                    throw new Exception('Invalid path: ' + original, { loc });
                } else if (part === '..') {
                    depth++;
                }
            } else {
                dig.push(part);
            }
        }
        return {
            type: 'PathExpression',
            data,
            depth,
            parts: dig,
            original,
            loc
        };
    }
    function prepareMustache(path, params, hash, open, strip, locInfo) {
        let escapeFlag = open.charAt(3) || open.charAt(2), escaped = escapeFlag !== '{' && escapeFlag !== '&';
        let decorator = /\*/.test(open);
        return {
            type: decorator ? 'Decorator' : 'MustacheStatement',
            path,
            params,
            hash,
            escaped,
            strip,
            loc: this.locInfo(locInfo)
        };
    }
    function prepareRawBlock(openRawBlock, contents, close, locInfo) {
        validateClose(openRawBlock, close);
        locInfo = this.locInfo(locInfo);
        let program = {
            type: 'Program',
            body: contents,
            strip: {},
            loc: locInfo
        };
        return {
            type: 'BlockStatement',
            path: openRawBlock.path,
            params: openRawBlock.params,
            hash: openRawBlock.hash,
            program,
            openStrip: {},
            inverseStrip: {},
            closeStrip: {},
            loc: locInfo
        };
    }
    function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
        if (close && close.path) {
            validateClose(openBlock, close);
        }
        let decorator = /\*/.test(openBlock.open);
        program.blockParams = openBlock.blockParams;
        let inverse, inverseStrip;
        if (inverseAndProgram) {
            if (decorator) {
                throw new Exception('Unexpected inverse block on decorator', inverseAndProgram);
            }
            if (inverseAndProgram.chain) {
                inverseAndProgram.program.body[0].closeStrip = close.strip;
            }
            inverseStrip = inverseAndProgram.strip;
            inverse = inverseAndProgram.program;
        }
        if (inverted) {
            inverted = inverse;
            inverse = program;
            program = inverted;
        }
        return {
            type: decorator ? 'DecoratorBlock' : 'BlockStatement',
            path: openBlock.path,
            params: openBlock.params,
            hash: openBlock.hash,
            program,
            inverse,
            openStrip: openBlock.strip,
            inverseStrip,
            closeStrip: close && close.strip,
            loc: this.locInfo(locInfo)
        };
    }
    function prepareProgram(statements, loc) {
        if (!loc && statements.length) {
            const firstLoc = statements[0].loc, lastLoc = statements[statements.length - 1].loc;
            if (firstLoc && lastLoc) {
                loc = {
                    source: firstLoc.source,
                    start: {
                        line: firstLoc.start.line,
                        column: firstLoc.start.column
                    },
                    end: {
                        line: lastLoc.end.line,
                        column: lastLoc.end.column
                    }
                };
            }
        }
        return {
            type: 'Program',
            body: statements,
            strip: {},
            loc: loc
        };
    }
    function preparePartialBlock(open, program, close, locInfo) {
        validateClose(open, close);
        return {
            type: 'PartialBlockStatement',
            name: open.path,
            params: open.params,
            hash: open.hash,
            program,
            openStrip: open.strip,
            closeStrip: close && close.strip,
            loc: this.locInfo(locInfo)
        };
    }
    return {
        SourceLocation: SourceLocation,
        id: id,
        stripFlags: stripFlags,
        stripComment: stripComment,
        preparePath: preparePath,
        prepareMustache: prepareMustache,
        prepareRawBlock: prepareRawBlock,
        prepareBlock: prepareBlock,
        prepareProgram: prepareProgram,
        preparePartialBlock: preparePartialBlock
    };
});
define('skylark-handlebars/compiler/base',[
    './parser',
    './whitespace-control',
    './helpers',
    '../utils'
], function (parser, WhitespaceControl, Helpers, a) {
    'use strict';
    let yy = {};
    a.extend(yy, Helpers);
    function parseWithoutProcessing(input, options) {
        if (input.type === 'Program') {
            return input;
        }
        parser.yy = yy;
        yy.locInfo = function (locInfo) {
            return new yy.SourceLocation(options && options.srcName, locInfo);
        };
        let ast = parser.parse(input);
        return ast;
    }
    function parse(input, options) {
        let ast = parseWithoutProcessing(input, options);
        let strip = new WhitespaceControl(options);
        return strip.accept(ast);
    }
    return {
        parser,
        parseWithoutProcessing: parseWithoutProcessing,
        parse: parse
    };
});
define('skylark-handlebars/compiler/compiler',[
    '../exception',
    '../utils',
    './ast'
], function (Exception, utils, AST) {
    'use strict';
    const slice = [].slice;
    function Compiler() {
    }
    Compiler.prototype = {
        compiler: Compiler,
        equals: function (other) {
            let len = this.opcodes.length;
            if (other.opcodes.length !== len) {
                return false;
            }
            for (let i = 0; i < len; i++) {
                let opcode = this.opcodes[i], otherOpcode = other.opcodes[i];
                if (opcode.opcode !== otherOpcode.opcode || !argEquals(opcode.args, otherOpcode.args)) {
                    return false;
                }
            }
            len = this.children.length;
            for (let i = 0; i < len; i++) {
                if (!this.children[i].equals(other.children[i])) {
                    return false;
                }
            }
            return true;
        },
        guid: 0,
        compile: function (program, options) {
            this.sourceNode = [];
            this.opcodes = [];
            this.children = [];
            this.options = options;
            this.stringParams = options.stringParams;
            this.trackIds = options.trackIds;
            options.blockParams = options.blockParams || [];
            options.knownHelpers = utils.extend(Object.create(null), {
                helperMissing: true,
                blockHelperMissing: true,
                each: true,
                if: true,
                unless: true,
                with: true,
                log: true,
                lookup: true
            }, options.knownHelpers);
            return this.accept(program);
        },
        compileProgram: function (program) {
            let childCompiler = new this.compiler(), result = childCompiler.compile(program, this.options), guid = this.guid++;
            this.usePartial = this.usePartial || result.usePartial;
            this.children[guid] = result;
            this.useDepths = this.useDepths || result.useDepths;
            return guid;
        },
        accept: function (node) {
            if (!this[node.type]) {
                throw new Exception('Unknown type: ' + node.type, node);
            }
            this.sourceNode.unshift(node);
            let ret = this[node.type](node);
            this.sourceNode.shift();
            return ret;
        },
        Program: function (program) {
            this.options.blockParams.unshift(program.blockParams);
            let body = program.body, bodyLength = body.length;
            for (let i = 0; i < bodyLength; i++) {
                this.accept(body[i]);
            }
            this.options.blockParams.shift();
            this.isSimple = bodyLength === 1;
            this.blockParams = program.blockParams ? program.blockParams.length : 0;
            return this;
        },
        BlockStatement: function (block) {
            transformLiteralToPath(block);
            let program = block.program, inverse = block.inverse;
            program = program && this.compileProgram(program);
            inverse = inverse && this.compileProgram(inverse);
            let type = this.classifySexpr(block);
            if (type === 'helper') {
                this.helperSexpr(block, program, inverse);
            } else if (type === 'simple') {
                this.simpleSexpr(block);
                this.opcode('pushProgram', program);
                this.opcode('pushProgram', inverse);
                this.opcode('emptyHash');
                this.opcode('blockValue', block.path.original);
            } else {
                this.ambiguousSexpr(block, program, inverse);
                this.opcode('pushProgram', program);
                this.opcode('pushProgram', inverse);
                this.opcode('emptyHash');
                this.opcode('ambiguousBlockValue');
            }
            this.opcode('append');
        },
        DecoratorBlock(decorator) {
            let program = decorator.program && this.compileProgram(decorator.program);
            let params = this.setupFullMustacheParams(decorator, program, undefined), path = decorator.path;
            this.useDecorators = true;
            this.opcode('registerDecorator', params.length, path.original);
        },
        PartialStatement: function (partial) {
            this.usePartial = true;
            let program = partial.program;
            if (program) {
                program = this.compileProgram(partial.program);
            }
            let params = partial.params;
            if (params.length > 1) {
                throw new Exception('Unsupported number of partial arguments: ' + params.length, partial);
            } else if (!params.length) {
                if (this.options.explicitPartialContext) {
                    this.opcode('pushLiteral', 'undefined');
                } else {
                    params.push({
                        type: 'PathExpression',
                        parts: [],
                        depth: 0
                    });
                }
            }
            let partialName = partial.name.original, isDynamic = partial.name.type === 'SubExpression';
            if (isDynamic) {
                this.accept(partial.name);
            }
            this.setupFullMustacheParams(partial, program, undefined, true);
            let indent = partial.indent || '';
            if (this.options.preventIndent && indent) {
                this.opcode('appendContent', indent);
                indent = '';
            }
            this.opcode('invokePartial', isDynamic, partialName, indent);
            this.opcode('append');
        },
        PartialBlockStatement: function (partialBlock) {
            this.PartialStatement(partialBlock);
        },
        MustacheStatement: function (mustache) {
            this.SubExpression(mustache);
            if (mustache.escaped && !this.options.noEscape) {
                this.opcode('appendEscaped');
            } else {
                this.opcode('append');
            }
        },
        Decorator(decorator) {
            this.DecoratorBlock(decorator);
        },
        ContentStatement: function (content) {
            if (content.value) {
                this.opcode('appendContent', content.value);
            }
        },
        CommentStatement: function () {
        },
        SubExpression: function (sexpr) {
            transformLiteralToPath(sexpr);
            let type = this.classifySexpr(sexpr);
            if (type === 'simple') {
                this.simpleSexpr(sexpr);
            } else if (type === 'helper') {
                this.helperSexpr(sexpr);
            } else {
                this.ambiguousSexpr(sexpr);
            }
        },
        ambiguousSexpr: function (sexpr, program, inverse) {
            let path = sexpr.path, name = path.parts[0], isBlock = program != null || inverse != null;
            this.opcode('getContext', path.depth);
            this.opcode('pushProgram', program);
            this.opcode('pushProgram', inverse);
            path.strict = true;
            this.accept(path);
            this.opcode('invokeAmbiguous', name, isBlock);
        },
        simpleSexpr: function (sexpr) {
            let path = sexpr.path;
            path.strict = true;
            this.accept(path);
            this.opcode('resolvePossibleLambda');
        },
        helperSexpr: function (sexpr, program, inverse) {
            let params = this.setupFullMustacheParams(sexpr, program, inverse), path = sexpr.path, name = path.parts[0];
            if (this.options.knownHelpers[name]) {
                this.opcode('invokeKnownHelper', params.length, name);
            } else if (this.options.knownHelpersOnly) {
                throw new Exception('You specified knownHelpersOnly, but used the unknown helper ' + name, sexpr);
            } else {
                path.strict = true;
                path.falsy = true;
                this.accept(path);
                this.opcode('invokeHelper', params.length, path.original, AST.helpers.simpleId(path));
            }
        },
        PathExpression: function (path) {
            this.addDepth(path.depth);
            this.opcode('getContext', path.depth);
            let name = path.parts[0], scoped = AST.helpers.scopedId(path), blockParamId = !path.depth && !scoped && this.blockParamIndex(name);
            if (blockParamId) {
                this.opcode('lookupBlockParam', blockParamId, path.parts);
            } else if (!name) {
                this.opcode('pushContext');
            } else if (path.data) {
                this.options.data = true;
                this.opcode('lookupData', path.depth, path.parts, path.strict);
            } else {
                this.opcode('lookupOnContext', path.parts, path.falsy, path.strict, scoped);
            }
        },
        StringLiteral: function (string) {
            this.opcode('pushString', string.value);
        },
        NumberLiteral: function (number) {
            this.opcode('pushLiteral', number.value);
        },
        BooleanLiteral: function (bool) {
            this.opcode('pushLiteral', bool.value);
        },
        UndefinedLiteral: function () {
            this.opcode('pushLiteral', 'undefined');
        },
        NullLiteral: function () {
            this.opcode('pushLiteral', 'null');
        },
        Hash: function (hash) {
            let pairs = hash.pairs, i = 0, l = pairs.length;
            this.opcode('pushHash');
            for (; i < l; i++) {
                this.pushParam(pairs[i].value);
            }
            while (i--) {
                this.opcode('assignToHash', pairs[i].key);
            }
            this.opcode('popHash');
        },
        opcode: function (name) {
            this.opcodes.push({
                opcode: name,
                args: slice.call(arguments, 1),
                loc: this.sourceNode[0].loc
            });
        },
        addDepth: function (depth) {
            if (!depth) {
                return;
            }
            this.useDepths = true;
        },
        classifySexpr: function (sexpr) {
            let isSimple = AST.helpers.simpleId(sexpr.path);
            let isBlockParam = isSimple && !!this.blockParamIndex(sexpr.path.parts[0]);
            let isHelper = !isBlockParam && AST.helpers.helperExpression(sexpr);
            let isEligible = !isBlockParam && (isHelper || isSimple);
            if (isEligible && !isHelper) {
                let name = sexpr.path.parts[0], options = this.options;
                if (options.knownHelpers[name]) {
                    isHelper = true;
                } else if (options.knownHelpersOnly) {
                    isEligible = false;
                }
            }
            if (isHelper) {
                return 'helper';
            } else if (isEligible) {
                return 'ambiguous';
            } else {
                return 'simple';
            }
        },
        pushParams: function (params) {
            for (let i = 0, l = params.length; i < l; i++) {
                this.pushParam(params[i]);
            }
        },
        pushParam: function (val) {
            let value = val.value != null ? val.value : val.original || '';
            if (this.stringParams) {
                if (value.replace) {
                    value = value.replace(/^(\.?\.\/)*/g, '').replace(/\//g, '.');
                }
                if (val.depth) {
                    this.addDepth(val.depth);
                }
                this.opcode('getContext', val.depth || 0);
                this.opcode('pushStringParam', value, val.type);
                if (val.type === 'SubExpression') {
                    this.accept(val);
                }
            } else {
                if (this.trackIds) {
                    let blockParamIndex;
                    if (val.parts && !AST.helpers.scopedId(val) && !val.depth) {
                        blockParamIndex = this.blockParamIndex(val.parts[0]);
                    }
                    if (blockParamIndex) {
                        let blockParamChild = val.parts.slice(1).join('.');
                        this.opcode('pushId', 'BlockParam', blockParamIndex, blockParamChild);
                    } else {
                        value = val.original || value;
                        if (value.replace) {
                            value = value.replace(/^this(?:\.|$)/, '').replace(/^\.\//, '').replace(/^\.$/, '');
                        }
                        this.opcode('pushId', val.type, value);
                    }
                }
                this.accept(val);
            }
        },
        setupFullMustacheParams: function (sexpr, program, inverse, omitEmpty) {
            let params = sexpr.params;
            this.pushParams(params);
            this.opcode('pushProgram', program);
            this.opcode('pushProgram', inverse);
            if (sexpr.hash) {
                this.accept(sexpr.hash);
            } else {
                this.opcode('emptyHash', omitEmpty);
            }
            return params;
        },
        blockParamIndex: function (name) {
            for (let depth = 0, len = this.options.blockParams.length; depth < len; depth++) {
                let blockParams = this.options.blockParams[depth], param = blockParams && utils.indexOf(blockParams, name);
                if (blockParams && param >= 0) {
                    return [
                        depth,
                        param
                    ];
                }
            }
        }
    };
    function precompile(input, options, env) {
        if (input == null || typeof input !== 'string' && input.type !== 'Program') {
            throw new Exception('You must pass a string or Handlebars AST to Handlebars.precompile. You passed ' + input);
        }
        options = options || {};
        if (!('data' in options)) {
            options.data = true;
        }
        if (options.compat) {
            options.useDepths = true;
        }
        let ast = env.parse(input, options), environment = new env.Compiler().compile(ast, options);
        return new env.JavaScriptCompiler().compile(environment, options);
    }
    function compile(input, options = {}, env) {
        if (input == null || typeof input !== 'string' && input.type !== 'Program') {
            throw new Exception('You must pass a string or Handlebars AST to Handlebars.compile. You passed ' + input);
        }
        options = utils.extend({}, options);
        if (!('data' in options)) {
            options.data = true;
        }
        if (options.compat) {
            options.useDepths = true;
        }
        let compiled;
        function compileInput() {
            let ast = env.parse(input, options), environment = new env.Compiler().compile(ast, options), templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
            return env.template(templateSpec);
        }
        function ret(context, execOptions) {
            if (!compiled) {
                compiled = compileInput();
            }
            return compiled.call(this, context, execOptions);
        }
        ret._setup = function (setupOptions) {
            if (!compiled) {
                compiled = compileInput();
            }
            return compiled._setup(setupOptions);
        };
        ret._child = function (i, data, blockParams, depths) {
            if (!compiled) {
                compiled = compileInput();
            }
            return compiled._child(i, data, blockParams, depths);
        };
        return ret;
    }
    function argEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (utils.isArray(a) && utils.isArray(b) && a.length === b.length) {
            for (let i = 0; i < a.length; i++) {
                if (!argEquals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    function transformLiteralToPath(sexpr) {
        if (!sexpr.path.parts) {
            let literal = sexpr.path;
            sexpr.path = {
                type: 'PathExpression',
                data: false,
                depth: 0,
                parts: [literal.original + ''],
                original: literal.original + '',
                loc: literal.loc
            };
        }
    }
    return {
        Compiler: Compiler,
        precompile: precompile,
        compile: compile
    };
});
define('skylark-handlebars/compiler/code-gen',['../utils'], function (a) {
    'use strict';
    let SourceNode;
    try {
        if (typeof define !== 'function' || !define.amd) {
            let SourceMap = require('source-map');
            SourceNode = SourceMap.SourceNode;
        }
    } catch (err) {
    }
    if (!SourceNode) {
        SourceNode = function (line, column, srcFile, chunks) {
            this.src = '';
            if (chunks) {
                this.add(chunks);
            }
        };
        SourceNode.prototype = {
            add: function (chunks) {
                if (a.isArray(chunks)) {
                    chunks = chunks.join('');
                }
                this.src += chunks;
            },
            prepend: function (chunks) {
                if (a.isArray(chunks)) {
                    chunks = chunks.join('');
                }
                this.src = chunks + this.src;
            },
            toStringWithSourceMap: function () {
                return { code: this.toString() };
            },
            toString: function () {
                return this.src;
            }
        };
    }
    function castChunk(chunk, codeGen, loc) {
        if (a.isArray(chunk)) {
            let ret = [];
            for (let i = 0, len = chunk.length; i < len; i++) {
                ret.push(codeGen.wrap(chunk[i], loc));
            }
            return ret;
        } else if (typeof chunk === 'boolean' || typeof chunk === 'number') {
            return chunk + '';
        }
        return chunk;
    }
    function CodeGen(srcFile) {
        this.srcFile = srcFile;
        this.source = [];
    }
    CodeGen.prototype = {
        isEmpty() {
            return !this.source.length;
        },
        prepend: function (source, loc) {
            this.source.unshift(this.wrap(source, loc));
        },
        push: function (source, loc) {
            this.source.push(this.wrap(source, loc));
        },
        merge: function () {
            let source = this.empty();
            this.each(function (line) {
                source.add([
                    '  ',
                    line,
                    '\n'
                ]);
            });
            return source;
        },
        each: function (iter) {
            for (let i = 0, len = this.source.length; i < len; i++) {
                iter(this.source[i]);
            }
        },
        empty: function () {
            let loc = this.currentLocation || { start: {} };
            return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
        },
        wrap: function (chunk, loc = this.currentLocation || { start: {} }) {
            if (chunk instanceof SourceNode) {
                return chunk;
            }
            chunk = castChunk(chunk, this, loc);
            return new SourceNode(loc.start.line, loc.start.column, this.srcFile, chunk);
        },
        functionCall: function (fn, type, params) {
            params = this.generateList(params);
            return this.wrap([
                fn,
                type ? '.' + type + '(' : '(',
                params,
                ')'
            ]);
        },
        quotedString: function (str) {
            return '"' + (str + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + '"';
        },
        objectLiteral: function (obj) {
            let pairs = [];
            Object.keys(obj).forEach(key => {
                let value = castChunk(obj[key], this);
                if (value !== 'undefined') {
                    pairs.push([
                        this.quotedString(key),
                        ':',
                        value
                    ]);
                }
            });
            let ret = this.generateList(pairs);
            ret.prepend('{');
            ret.add('}');
            return ret;
        },
        generateList: function (entries) {
            let ret = this.empty();
            for (let i = 0, len = entries.length; i < len; i++) {
                if (i) {
                    ret.add(',');
                }
                ret.add(castChunk(entries[i], this));
            }
            return ret;
        },
        generateArray: function (entries) {
            let ret = this.generateList(entries);
            ret.prepend('[');
            ret.add(']');
            return ret;
        }
    };
    return CodeGen;
});
define('skylark-handlebars/compiler/javascript-compiler',[
    '../base',
    '../exception',
    '../utils',
    './code-gen'
], function (base, Exception, utils, CodeGen) {
    'use strict';
    function Literal(value) {
        this.value = value;
    }
    function JavaScriptCompiler() {
    }
    JavaScriptCompiler.prototype = {
        nameLookup: function (parent, name) {
            return this.internalNameLookup(parent, name);
        },
        depthedLookup: function (name) {
            return [
                this.aliasable('container.lookup'),
                '(depths, "',
                name,
                '")'
            ];
        },
        compilerInfo: function () {
            const revision = base.COMPILER_REVISION, versions = base.REVISION_CHANGES[revision];
            return [
                revision,
                versions
            ];
        },
        appendToBuffer: function (source, location, explicit) {
            if (!utils.isArray(source)) {
                source = [source];
            }
            source = this.source.wrap(source, location);
            if (this.environment.isSimple) {
                return [
                    'return ',
                    source,
                    ';'
                ];
            } else if (explicit) {
                return [
                    'buffer += ',
                    source,
                    ';'
                ];
            } else {
                source.appendToBuffer = true;
                return source;
            }
        },
        initializeBuffer: function () {
            return this.quotedString('');
        },
        internalNameLookup: function (parent, name) {
            this.lookupPropertyFunctionIsUsed = true;
            return [
                'lookupProperty(',
                parent,
                ',',
                JSON.stringify(name),
                ')'
            ];
        },
        lookupPropertyFunctionIsUsed: false,
        compile: function (environment, options, context, asObject) {
            this.environment = environment;
            this.options = options;
            this.stringParams = this.options.stringParams;
            this.trackIds = this.options.trackIds;
            this.precompile = !asObject;
            this.name = this.environment.name;
            this.isChild = !!context;
            this.context = context || {
                decorators: [],
                programs: [],
                environments: []
            };
            this.preamble();
            this.stackSlot = 0;
            this.stackVars = [];
            this.aliases = {};
            this.registers = { list: [] };
            this.hashes = [];
            this.compileStack = [];
            this.inlineStack = [];
            this.blockParams = [];
            this.compileChildren(environment, options);
            this.useDepths = this.useDepths || environment.useDepths || environment.useDecorators || this.options.compat;
            this.useBlockParams = this.useBlockParams || environment.useBlockParams;
            let opcodes = environment.opcodes, opcode, firstLoc, i, l;
            for (i = 0, l = opcodes.length; i < l; i++) {
                opcode = opcodes[i];
                this.source.currentLocation = opcode.loc;
                firstLoc = firstLoc || opcode.loc;
                this[opcode.opcode].apply(this, opcode.args);
            }
            this.source.currentLocation = firstLoc;
            this.pushSource('');
            if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
                throw new Exception('Compile completed with content left on stack');
            }
            if (!this.decorators.isEmpty()) {
                this.useDecorators = true;
                this.decorators.prepend([
                    'var decorators = container.decorators, ',
                    this.lookupPropertyFunctionVarDeclaration(),
                    ';\n'
                ]);
                this.decorators.push('return fn;');
                if (asObject) {
                    this.decorators = Function.apply(this, [
                        'fn',
                        'props',
                        'container',
                        'depth0',
                        'data',
                        'blockParams',
                        'depths',
                        this.decorators.merge()
                    ]);
                } else {
                    this.decorators.prepend('function(fn, props, container, depth0, data, blockParams, depths) {\n');
                    this.decorators.push('}\n');
                    this.decorators = this.decorators.merge();
                }
            } else {
                this.decorators = undefined;
            }
            let fn = this.createFunctionContext(asObject);
            if (!this.isChild) {
                let ret = {
                    compiler: this.compilerInfo(),
                    main: fn
                };
                if (this.decorators) {
                    ret.main_d = this.decorators;
                    ret.useDecorators = true;
                }
                let {programs, decorators} = this.context;
                for (i = 0, l = programs.length; i < l; i++) {
                    if (programs[i]) {
                        ret[i] = programs[i];
                        if (decorators[i]) {
                            ret[i + '_d'] = decorators[i];
                            ret.useDecorators = true;
                        }
                    }
                }
                if (this.environment.usePartial) {
                    ret.usePartial = true;
                }
                if (this.options.data) {
                    ret.useData = true;
                }
                if (this.useDepths) {
                    ret.useDepths = true;
                }
                if (this.useBlockParams) {
                    ret.useBlockParams = true;
                }
                if (this.options.compat) {
                    ret.compat = true;
                }
                if (!asObject) {
                    ret.compiler = JSON.stringify(ret.compiler);
                    this.source.currentLocation = {
                        start: {
                            line: 1,
                            column: 0
                        }
                    };
                    ret = this.objectLiteral(ret);
                    if (options.srcName) {
                        ret = ret.toStringWithSourceMap({ file: options.destName });
                        ret.map = ret.map && ret.map.toString();
                    } else {
                        ret = ret.toString();
                    }
                } else {
                    ret.compilerOptions = this.options;
                }
                return ret;
            } else {
                return fn;
            }
        },
        preamble: function () {
            this.lastContext = 0;
            this.source = new CodeGen(this.options.srcName);
            this.decorators = new CodeGen(this.options.srcName);
        },
        createFunctionContext: function (asObject) {
            let varDeclarations = '';
            let locals = this.stackVars.concat(this.registers.list);
            if (locals.length > 0) {
                varDeclarations += ', ' + locals.join(', ');
            }
            let aliasCount = 0;
            Object.keys(this.aliases).forEach(alias => {
                let node = this.aliases[alias];
                if (node.children && node.referenceCount > 1) {
                    varDeclarations += ', alias' + ++aliasCount + '=' + alias;
                    node.children[0] = 'alias' + aliasCount;
                }
            });
            if (this.lookupPropertyFunctionIsUsed) {
                varDeclarations += ', ' + this.lookupPropertyFunctionVarDeclaration();
            }
            let params = [
                'container',
                'depth0',
                'helpers',
                'partials',
                'data'
            ];
            if (this.useBlockParams || this.useDepths) {
                params.push('blockParams');
            }
            if (this.useDepths) {
                params.push('depths');
            }
            let source = this.mergeSource(varDeclarations);
            if (asObject) {
                params.push(source);
                return Function.apply(this, params);
            } else {
                return this.source.wrap([
                    'function(',
                    params.join(','),
                    ') {\n  ',
                    source,
                    '}'
                ]);
            }
        },
        mergeSource: function (varDeclarations) {
            let isSimple = this.environment.isSimple, appendOnly = !this.forceBuffer, appendFirst, sourceSeen, bufferStart, bufferEnd;
            this.source.each(line => {
                if (line.appendToBuffer) {
                    if (bufferStart) {
                        line.prepend('  + ');
                    } else {
                        bufferStart = line;
                    }
                    bufferEnd = line;
                } else {
                    if (bufferStart) {
                        if (!sourceSeen) {
                            appendFirst = true;
                        } else {
                            bufferStart.prepend('buffer += ');
                        }
                        bufferEnd.add(';');
                        bufferStart = bufferEnd = undefined;
                    }
                    sourceSeen = true;
                    if (!isSimple) {
                        appendOnly = false;
                    }
                }
            });
            if (appendOnly) {
                if (bufferStart) {
                    bufferStart.prepend('return ');
                    bufferEnd.add(';');
                } else if (!sourceSeen) {
                    this.source.push('return "";');
                }
            } else {
                varDeclarations += ', buffer = ' + (appendFirst ? '' : this.initializeBuffer());
                if (bufferStart) {
                    bufferStart.prepend('return buffer + ');
                    bufferEnd.add(';');
                } else {
                    this.source.push('return buffer;');
                }
            }
            if (varDeclarations) {
                this.source.prepend('var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n'));
            }
            return this.source.merge();
        },
        lookupPropertyFunctionVarDeclaration: function () {
            return `
      lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    }
    `.trim();
        },
        blockValue: function (name) {
            let blockHelperMissing = this.aliasable('container.hooks.blockHelperMissing'), params = [this.contextName(0)];
            this.setupHelperArgs(name, 0, params);
            let blockName = this.popStack();
            params.splice(1, 0, blockName);
            this.push(this.source.functionCall(blockHelperMissing, 'call', params));
        },
        ambiguousBlockValue: function () {
            let blockHelperMissing = this.aliasable('container.hooks.blockHelperMissing'), params = [this.contextName(0)];
            this.setupHelperArgs('', 0, params, true);
            this.flushInline();
            let current = this.topStack();
            params.splice(1, 0, current);
            this.pushSource([
                'if (!',
                this.lastHelper,
                ') { ',
                current,
                ' = ',
                this.source.functionCall(blockHelperMissing, 'call', params),
                '}'
            ]);
        },
        appendContent: function (content) {
            if (this.pendingContent) {
                content = this.pendingContent + content;
            } else {
                this.pendingLocation = this.source.currentLocation;
            }
            this.pendingContent = content;
        },
        append: function () {
            if (this.isInline()) {
                this.replaceStack(current => [
                    ' != null ? ',
                    current,
                    ' : ""'
                ]);
                this.pushSource(this.appendToBuffer(this.popStack()));
            } else {
                let local = this.popStack();
                this.pushSource([
                    'if (',
                    local,
                    ' != null) { ',
                    this.appendToBuffer(local, undefined, true),
                    ' }'
                ]);
                if (this.environment.isSimple) {
                    this.pushSource([
                        'else { ',
                        this.appendToBuffer("''", undefined, true),
                        ' }'
                    ]);
                }
            }
        },
        appendEscaped: function () {
            this.pushSource(this.appendToBuffer([
                this.aliasable('container.escapeExpression'),
                '(',
                this.popStack(),
                ')'
            ]));
        },
        getContext: function (depth) {
            this.lastContext = depth;
        },
        pushContext: function () {
            this.pushStackLiteral(this.contextName(this.lastContext));
        },
        lookupOnContext: function (parts, falsy, strict, scoped) {
            let i = 0;
            if (!scoped && this.options.compat && !this.lastContext) {
                this.push(this.depthedLookup(parts[i++]));
            } else {
                this.pushContext();
            }
            this.resolvePath('context', parts, i, falsy, strict);
        },
        lookupBlockParam: function (blockParamId, parts) {
            this.useBlockParams = true;
            this.push([
                'blockParams[',
                blockParamId[0],
                '][',
                blockParamId[1],
                ']'
            ]);
            this.resolvePath('context', parts, 1);
        },
        lookupData: function (depth, parts, strict) {
            if (!depth) {
                this.pushStackLiteral('data');
            } else {
                this.pushStackLiteral('container.data(data, ' + depth + ')');
            }
            this.resolvePath('data', parts, 0, true, strict);
        },
        resolvePath: function (type, parts, i, falsy, strict) {
            if (this.options.strict || this.options.assumeObjects) {
                this.push(strictLookup(this.options.strict && strict, this, parts, type));
                return;
            }
            let len = parts.length;
            for (; i < len; i++) {
                this.replaceStack(current => {
                    let lookup = this.nameLookup(current, parts[i], type);
                    if (!falsy) {
                        return [
                            ' != null ? ',
                            lookup,
                            ' : ',
                            current
                        ];
                    } else {
                        return [
                            ' && ',
                            lookup
                        ];
                    }
                });
            }
        },
        resolvePossibleLambda: function () {
            this.push([
                this.aliasable('container.lambda'),
                '(',
                this.popStack(),
                ', ',
                this.contextName(0),
                ')'
            ]);
        },
        pushStringParam: function (string, type) {
            this.pushContext();
            this.pushString(type);
            if (type !== 'SubExpression') {
                if (typeof string === 'string') {
                    this.pushString(string);
                } else {
                    this.pushStackLiteral(string);
                }
            }
        },
        emptyHash: function (omitEmpty) {
            if (this.trackIds) {
                this.push('{}');
            }
            if (this.stringParams) {
                this.push('{}');
                this.push('{}');
            }
            this.pushStackLiteral(omitEmpty ? 'undefined' : '{}');
        },
        pushHash: function () {
            if (this.hash) {
                this.hashes.push(this.hash);
            }
            this.hash = {
                values: {},
                types: [],
                contexts: [],
                ids: []
            };
        },
        popHash: function () {
            let hash = this.hash;
            this.hash = this.hashes.pop();
            if (this.trackIds) {
                this.push(this.objectLiteral(hash.ids));
            }
            if (this.stringParams) {
                this.push(this.objectLiteral(hash.contexts));
                this.push(this.objectLiteral(hash.types));
            }
            this.push(this.objectLiteral(hash.values));
        },
        pushString: function (string) {
            this.pushStackLiteral(this.quotedString(string));
        },
        pushLiteral: function (value) {
            this.pushStackLiteral(value);
        },
        pushProgram: function (guid) {
            if (guid != null) {
                this.pushStackLiteral(this.programExpression(guid));
            } else {
                this.pushStackLiteral(null);
            }
        },
        registerDecorator(paramSize, name) {
            let foundDecorator = this.nameLookup('decorators', name, 'decorator'), options = this.setupHelperArgs(name, paramSize);
            this.decorators.push([
                'fn = ',
                this.decorators.functionCall(foundDecorator, '', [
                    'fn',
                    'props',
                    'container',
                    options
                ]),
                ' || fn;'
            ]);
        },
        invokeHelper: function (paramSize, name, isSimple) {
            let nonHelper = this.popStack(), helper = this.setupHelper(paramSize, name);
            let possibleFunctionCalls = [];
            if (isSimple) {
                possibleFunctionCalls.push(helper.name);
            }
            possibleFunctionCalls.push(nonHelper);
            if (!this.options.strict) {
                possibleFunctionCalls.push(this.aliasable('container.hooks.helperMissing'));
            }
            let functionLookupCode = [
                '(',
                this.itemsSeparatedBy(possibleFunctionCalls, '||'),
                ')'
            ];
            let functionCall = this.source.functionCall(functionLookupCode, 'call', helper.callParams);
            this.push(functionCall);
        },
        itemsSeparatedBy: function (items, separator) {
            let result = [];
            result.push(items[0]);
            for (let i = 1; i < items.length; i++) {
                result.push(separator, items[i]);
            }
            return result;
        },
        invokeKnownHelper: function (paramSize, name) {
            let helper = this.setupHelper(paramSize, name);
            this.push(this.source.functionCall(helper.name, 'call', helper.callParams));
        },
        invokeAmbiguous: function (name, helperCall) {
            this.useRegister('helper');
            let nonHelper = this.popStack();
            this.emptyHash();
            let helper = this.setupHelper(0, name, helperCall);
            let helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');
            let lookup = [
                '(',
                '(helper = ',
                helperName,
                ' || ',
                nonHelper,
                ')'
            ];
            if (!this.options.strict) {
                lookup[0] = '(helper = ';
                lookup.push(' != null ? helper : ', this.aliasable('container.hooks.helperMissing'));
            }
            this.push([
                '(',
                lookup,
                helper.paramsInit ? [
                    '),(',
                    helper.paramsInit
                ] : [],
                '),',
                '(typeof helper === ',
                this.aliasable('"function"'),
                ' ? ',
                this.source.functionCall('helper', 'call', helper.callParams),
                ' : helper))'
            ]);
        },
        invokePartial: function (isDynamic, name, indent) {
            let params = [], options = this.setupParams(name, 1, params);
            if (isDynamic) {
                name = this.popStack();
                delete options.name;
            }
            if (indent) {
                options.indent = JSON.stringify(indent);
            }
            options.helpers = 'helpers';
            options.partials = 'partials';
            options.decorators = 'container.decorators';
            if (!isDynamic) {
                params.unshift(this.nameLookup('partials', name, 'partial'));
            } else {
                params.unshift(name);
            }
            if (this.options.compat) {
                options.depths = 'depths';
            }
            options = this.objectLiteral(options);
            params.push(options);
            this.push(this.source.functionCall('container.invokePartial', '', params));
        },
        assignToHash: function (key) {
            let value = this.popStack(), context, type, id;
            if (this.trackIds) {
                id = this.popStack();
            }
            if (this.stringParams) {
                type = this.popStack();
                context = this.popStack();
            }
            let hash = this.hash;
            if (context) {
                hash.contexts[key] = context;
            }
            if (type) {
                hash.types[key] = type;
            }
            if (id) {
                hash.ids[key] = id;
            }
            hash.values[key] = value;
        },
        pushId: function (type, name, child) {
            if (type === 'BlockParam') {
                this.pushStackLiteral('blockParams[' + name[0] + '].path[' + name[1] + ']' + (child ? ' + ' + JSON.stringify('.' + child) : ''));
            } else if (type === 'PathExpression') {
                this.pushString(name);
            } else if (type === 'SubExpression') {
                this.pushStackLiteral('true');
            } else {
                this.pushStackLiteral('null');
            }
        },
        compiler: JavaScriptCompiler,
        compileChildren: function (environment, options) {
            let children = environment.children, child, compiler;
            for (let i = 0, l = children.length; i < l; i++) {
                child = children[i];
                compiler = new this.compiler();
                let existing = this.matchExistingProgram(child);
                if (existing == null) {
                    this.context.programs.push('');
                    let index = this.context.programs.length;
                    child.index = index;
                    child.name = 'program' + index;
                    this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
                    this.context.decorators[index] = compiler.decorators;
                    this.context.environments[index] = child;
                    this.useDepths = this.useDepths || compiler.useDepths;
                    this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
                    child.useDepths = this.useDepths;
                    child.useBlockParams = this.useBlockParams;
                } else {
                    child.index = existing.index;
                    child.name = 'program' + existing.index;
                    this.useDepths = this.useDepths || existing.useDepths;
                    this.useBlockParams = this.useBlockParams || existing.useBlockParams;
                }
            }
        },
        matchExistingProgram: function (child) {
            for (let i = 0, len = this.context.environments.length; i < len; i++) {
                let environment = this.context.environments[i];
                if (environment && environment.equals(child)) {
                    return environment;
                }
            }
        },
        programExpression: function (guid) {
            let child = this.environment.children[guid], programParams = [
                    child.index,
                    'data',
                    child.blockParams
                ];
            if (this.useBlockParams || this.useDepths) {
                programParams.push('blockParams');
            }
            if (this.useDepths) {
                programParams.push('depths');
            }
            return 'container.program(' + programParams.join(', ') + ')';
        },
        useRegister: function (name) {
            if (!this.registers[name]) {
                this.registers[name] = true;
                this.registers.list.push(name);
            }
        },
        push: function (expr) {
            if (!(expr instanceof Literal)) {
                expr = this.source.wrap(expr);
            }
            this.inlineStack.push(expr);
            return expr;
        },
        pushStackLiteral: function (item) {
            this.push(new Literal(item));
        },
        pushSource: function (source) {
            if (this.pendingContent) {
                this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
                this.pendingContent = undefined;
            }
            if (source) {
                this.source.push(source);
            }
        },
        replaceStack: function (callback) {
            let prefix = ['('], stack, createdStack, usedLiteral;
            if (!this.isInline()) {
                throw new Exception('replaceStack on non-inline');
            }
            let top = this.popStack(true);
            if (top instanceof Literal) {
                stack = [top.value];
                prefix = [
                    '(',
                    stack
                ];
                usedLiteral = true;
            } else {
                createdStack = true;
                let name = this.incrStack();
                prefix = [
                    '((',
                    this.push(name),
                    ' = ',
                    top,
                    ')'
                ];
                stack = this.topStack();
            }
            let item = callback.call(this, stack);
            if (!usedLiteral) {
                this.popStack();
            }
            if (createdStack) {
                this.stackSlot--;
            }
            this.push(prefix.concat(item, ')'));
        },
        incrStack: function () {
            this.stackSlot++;
            if (this.stackSlot > this.stackVars.length) {
                this.stackVars.push('stack' + this.stackSlot);
            }
            return this.topStackName();
        },
        topStackName: function () {
            return 'stack' + this.stackSlot;
        },
        flushInline: function () {
            let inlineStack = this.inlineStack;
            this.inlineStack = [];
            for (let i = 0, len = inlineStack.length; i < len; i++) {
                let entry = inlineStack[i];
                if (entry instanceof Literal) {
                    this.compileStack.push(entry);
                } else {
                    let stack = this.incrStack();
                    this.pushSource([
                        stack,
                        ' = ',
                        entry,
                        ';'
                    ]);
                    this.compileStack.push(stack);
                }
            }
        },
        isInline: function () {
            return this.inlineStack.length;
        },
        popStack: function (wrapped) {
            let inline = this.isInline(), item = (inline ? this.inlineStack : this.compileStack).pop();
            if (!wrapped && item instanceof Literal) {
                return item.value;
            } else {
                if (!inline) {
                    if (!this.stackSlot) {
                        throw new Exception('Invalid stack pop');
                    }
                    this.stackSlot--;
                }
                return item;
            }
        },
        topStack: function () {
            let stack = this.isInline() ? this.inlineStack : this.compileStack, item = stack[stack.length - 1];
            if (item instanceof Literal) {
                return item.value;
            } else {
                return item;
            }
        },
        contextName: function (context) {
            if (this.useDepths && context) {
                return 'depths[' + context + ']';
            } else {
                return 'depth' + context;
            }
        },
        quotedString: function (str) {
            return this.source.quotedString(str);
        },
        objectLiteral: function (obj) {
            return this.source.objectLiteral(obj);
        },
        aliasable: function (name) {
            let ret = this.aliases[name];
            if (ret) {
                ret.referenceCount++;
                return ret;
            }
            ret = this.aliases[name] = this.source.wrap(name);
            ret.aliasable = true;
            ret.referenceCount = 1;
            return ret;
        },
        setupHelper: function (paramSize, name, blockHelper) {
            let params = [], paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
            let foundHelper = this.nameLookup('helpers', name, 'helper'), callContext = this.aliasable(`${ this.contextName(0) } != null ? ${ this.contextName(0) } : (container.nullContext || {})`);
            return {
                params: params,
                paramsInit: paramsInit,
                name: foundHelper,
                callParams: [callContext].concat(params)
            };
        },
        setupParams: function (helper, paramSize, params) {
            let options = {}, contexts = [], types = [], ids = [], objectArgs = !params, param;
            if (objectArgs) {
                params = [];
            }
            options.name = this.quotedString(helper);
            options.hash = this.popStack();
            if (this.trackIds) {
                options.hashIds = this.popStack();
            }
            if (this.stringParams) {
                options.hashTypes = this.popStack();
                options.hashContexts = this.popStack();
            }
            let inverse = this.popStack(), program = this.popStack();
            if (program || inverse) {
                options.fn = program || 'container.noop';
                options.inverse = inverse || 'container.noop';
            }
            let i = paramSize;
            while (i--) {
                param = this.popStack();
                params[i] = param;
                if (this.trackIds) {
                    ids[i] = this.popStack();
                }
                if (this.stringParams) {
                    types[i] = this.popStack();
                    contexts[i] = this.popStack();
                }
            }
            if (objectArgs) {
                options.args = this.source.generateArray(params);
            }
            if (this.trackIds) {
                options.ids = this.source.generateArray(ids);
            }
            if (this.stringParams) {
                options.types = this.source.generateArray(types);
                options.contexts = this.source.generateArray(contexts);
            }
            if (this.options.data) {
                options.data = 'data';
            }
            if (this.useBlockParams) {
                options.blockParams = 'blockParams';
            }
            return options;
        },
        setupHelperArgs: function (helper, paramSize, params, useRegister) {
            let options = this.setupParams(helper, paramSize, params);
            options.loc = JSON.stringify(this.source.currentLocation);
            options = this.objectLiteral(options);
            if (useRegister) {
                this.useRegister('options');
                params.push('options');
                return [
                    'options=',
                    options
                ];
            } else if (params) {
                params.push(options);
                return '';
            } else {
                return options;
            }
        }
    };
    (function () {
        const reservedWords = ('break else new var' + ' case finally return void' + ' catch for switch while' + ' continue function this with' + ' default if throw' + ' delete in try' + ' do instanceof typeof' + ' abstract enum int short' + ' boolean export interface static' + ' byte extends long super' + ' char final native synchronized' + ' class float package throws' + ' const goto private transient' + ' debugger implements protected volatile' + ' double import public let yield await' + ' null true false').split(' ');
        const compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};
        for (let i = 0, l = reservedWords.length; i < l; i++) {
            compilerWords[reservedWords[i]] = true;
        }
    }());
    JavaScriptCompiler.isValidJavaScriptVariableName = function (name) {
        return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
    };
    function strictLookup(requireTerminal, compiler, parts, type) {
        let stack = compiler.popStack(), i = 0, len = parts.length;
        if (requireTerminal) {
            len--;
        }
        for (; i < len; i++) {
            stack = compiler.nameLookup(stack, parts[i], type);
        }
        if (requireTerminal) {
            return [
                compiler.aliasable('container.strict'),
                '(',
                stack,
                ', ',
                compiler.quotedString(parts[i]),
                ', ',
                JSON.stringify(compiler.source.currentLocation),
                ' )'
            ];
        } else {
            return stack;
        }
    }
    return JavaScriptCompiler;
});
define('skylark-handlebars/main',[
    "skylark-langx/skylark",
    './base',
    "./utils",
    "./runtime",
    "./exception",
    "./safe-string",
    './compiler/ast',
    './compiler/base',
    './compiler/compiler',
    './compiler/javascript-compiler',
    './compiler/visitor'

], function (skylark, base, Utils,runtime,Exception,SafeString, AST,cbase, compiler, JavaScriptCompiler, Visitor) {
    'use strict';

    function create() {
        let hb = new base.HandlebarsEnvironment();
        Utils.extend(hb, base);
        hb.SafeString = SafeString;
        hb.Exception = Exception;
        hb.Utils = Utils;
        hb.escapeExpression = Utils.escapeExpression;
        hb.VM = runtime;

        hb.template = function (spec) {
            return runtime.template(spec, hb);
        };

        hb.compile = function (input, options) {
            return compiler.compile(input, options, hb);
        };

        hb.precompile = function (input, options) {
            return compiler.precompile(input, options, hb);
        };
        
        hb.AST = AST;
        hb.Compiler = compiler.Compiler;
        hb.JavaScriptCompiler = JavaScriptCompiler;
        hb.Parser = cbase.Parser;
        hb.parse = cbase.parse;
        hb.parseWithoutProcessing = base.parseWithoutProcessing;
        return hb;
    }
    let inst = create();
    inst.create = create;
    inst.Visitor = Visitor;

    return skylark.attach("intg.handlebars",inst);
});
define('skylark-handlebars', ['skylark-handlebars/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-handlebars.js.map
