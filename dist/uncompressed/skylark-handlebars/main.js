define([
    "skylark-langx/skylark",
    './compiler/ast',
    './compiler/base',
    './compiler/compiler',
    './compiler/javascript-compiler',
    './compiler/visitor'
], function (skylark, AST, base, compiler, JavaScriptCompiler, Visitor) {
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
        hb.Parser = base.Parser;
        hb.parse = base.parse;
        hb.parseWithoutProcessing = base.parseWithoutProcessing;
        return hb;
    }
    let inst = create();
    inst.create = create;
    inst.Visitor = Visitor;

    return skylark.attach("intg.handlebars",inst);
});