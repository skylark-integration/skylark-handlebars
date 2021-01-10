define([
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