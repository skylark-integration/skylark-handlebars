/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(function(){"use strict";const e=["description","fileName","lineNumber","endLineNumber","message","name","number","stack"];function t(r,n){let c,i,o,l,u=n&&n.loc;u&&(c=u.start.line,i=u.end.line,o=u.start.column,l=u.end.column,r+=" - "+c+":"+o);let s=Error.prototype.constructor.call(this,r);for(let t=0;t<e.length;t++)this[e[t]]=s[e[t]];Error.captureStackTrace&&Error.captureStackTrace(this,t);try{u&&(this.lineNumber=c,this.endLineNumber=i,Object.defineProperty?(Object.defineProperty(this,"column",{value:o,enumerable:!0}),Object.defineProperty(this,"endColumn",{value:l,enumerable:!0})):(this.column=o,this.endColumn=l))}catch(e){}}return t.prototype=new Error,t});
//# sourceMappingURL=sourcemaps/exception.js.map
