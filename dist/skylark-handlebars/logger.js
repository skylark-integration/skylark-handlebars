/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["./utils"],function(e){"use strict";let o={methodMap:["debug","info","warn","error"],level:"info",lookupLevel:function(n){if("string"==typeof n){let l=e.indexOf(o.methodMap,n.toLowerCase());n=l>=0?l:parseInt(n,10)}return n},log:function(e,...n){if(e=o.lookupLevel(e),"undefined"!=typeof console&&o.lookupLevel(o.level)<=e){let l=o.methodMap[e];console[l]||(l="log"),console[l](...n)}}};return o});
//# sourceMappingURL=sourcemaps/logger.js.map
