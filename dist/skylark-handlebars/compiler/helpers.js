/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../exception"],function(t){"use strict";function r(r,e){if(e=e.path?e.path.original:e,r.path.original!==e){let o={loc:r.path.loc};throw new t(r.path.original+" doesn't match "+e,o)}}return{SourceLocation:function(t,r){this.source=t,this.start={line:r.first_line,column:r.first_column},this.end={line:r.last_line,column:r.last_column}},id:function(t){return/^\[.*\]$/.test(t)?t.substring(1,t.length-1):t},stripFlags:function(t,r){return{open:"~"===t.charAt(2),close:"~"===r.charAt(r.length-3)}},stripComment:function(t){return t.replace(/^\{\{~?!-?-?/,"").replace(/-?-?~?\}\}$/,"")},preparePath:function(r,e,o){o=this.locInfo(o);let n=r?"@":"",a=[],i=0;for(let r=0,p=e.length;r<p;r++){let p=e[r].part,c=e[r].original!==p;if(n+=(e[r].separator||"")+p,c||".."!==p&&"."!==p&&"this"!==p)a.push(p);else{if(a.length>0)throw new t("Invalid path: "+n,{loc:o});".."===p&&i++}}return{type:"PathExpression",data:r,depth:i,parts:a,original:n,loc:o}},prepareMustache:function(t,r,e,o,n,a){let i=o.charAt(3)||o.charAt(2),p="{"!==i&&"&"!==i;return{type:/\*/.test(o)?"Decorator":"MustacheStatement",path:t,params:r,hash:e,escaped:p,strip:n,loc:this.locInfo(a)}},prepareRawBlock:function(t,e,o,n){r(t,o);let a={type:"Program",body:e,strip:{},loc:n=this.locInfo(n)};return{type:"BlockStatement",path:t.path,params:t.params,hash:t.hash,program:a,openStrip:{},inverseStrip:{},closeStrip:{},loc:n}},prepareBlock:function(e,o,n,a,i,p){a&&a.path&&r(e,a);let c,l,s=/\*/.test(e.open);if(o.blockParams=e.blockParams,n){if(s)throw new t("Unexpected inverse block on decorator",n);n.chain&&(n.program.body[0].closeStrip=a.strip),l=n.strip,c=n.program}return i&&(i=c,c=o,o=i),{type:s?"DecoratorBlock":"BlockStatement",path:e.path,params:e.params,hash:e.hash,program:o,inverse:c,openStrip:e.strip,inverseStrip:l,closeStrip:a&&a.strip,loc:this.locInfo(p)}},prepareProgram:function(t,r){if(!r&&t.length){const e=t[0].loc,o=t[t.length-1].loc;e&&o&&(r={source:e.source,start:{line:e.start.line,column:e.start.column},end:{line:o.end.line,column:o.end.column}})}return{type:"Program",body:t,strip:{},loc:r}},preparePartialBlock:function(t,e,o,n){return r(t,o),{type:"PartialBlockStatement",name:t.path,params:t.params,hash:t.hash,program:e,openStrip:t.strip,closeStrip:o&&o.strip,loc:this.locInfo(n)}}}});
//# sourceMappingURL=../sourcemaps/compiler/helpers.js.map
