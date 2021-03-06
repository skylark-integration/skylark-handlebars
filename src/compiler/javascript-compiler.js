define([
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