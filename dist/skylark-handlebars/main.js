/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["skylark-langx/skylark","./compiler/ast","./compiler/base","./compiler/compiler","./compiler/javascript-compiler","./compiler/visitor"],function(e,r,i,t,n,s){"use strict";function o(){let e=new i.HandlebarsEnvironment;return Utils.extend(e,i),e.SafeString=SafeString,e.Exception=Exception,e.Utils=Utils,e.escapeExpression=Utils.escapeExpression,e.VM=runtime,e.template=function(r){return runtime.template(r,e)},e.compile=function(r,i){return t.compile(r,i,e)},e.precompile=function(r,i){return t.precompile(r,i,e)},e.AST=r,e.Compiler=t.Compiler,e.JavaScriptCompiler=n,e.Parser=i.Parser,e.parse=i.parse,e.parseWithoutProcessing=i.parseWithoutProcessing,e}let p=o();return p.create=o,p.Visitor=s,e.attach("intg.handlebars",p)});
//# sourceMappingURL=sourcemaps/main.js.map
