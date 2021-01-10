/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["skylark-langx/skylark","./base","./utils","./runtime","./exception","./safe-string","./compiler/ast","./compiler/base","./compiler/compiler","./compiler/javascript-compiler","./compiler/visitor"],function(e,r,i,t,n,s,o,p,a,c,l){"use strict";function m(){let e=new r.HandlebarsEnvironment;return i.extend(e,r),e.SafeString=s,e.Exception=n,e.Utils=i,e.escapeExpression=i.escapeExpression,e.VM=t,e.template=function(r){return t.template(r,e)},e.compile=function(r,i){return a.compile(r,i,e)},e.precompile=function(r,i){return a.precompile(r,i,e)},e.AST=o,e.Compiler=a.Compiler,e.JavaScriptCompiler=c,e.Parser=p.Parser,e.parse=p.parse,e.parseWithoutProcessing=r.parseWithoutProcessing,e}let u=m();return u.create=m,u.Visitor=l,e.attach("intg.handlebars",u)});
//# sourceMappingURL=sourcemaps/main.js.map
