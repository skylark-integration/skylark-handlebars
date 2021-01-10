/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(function(){"use strict";return function(e){e.registerHelper("log",function(){let l=[void 0],t=arguments[arguments.length-1];for(let e=0;e<arguments.length-1;e++)l.push(arguments[e]);let n=1;null!=t.hash.level?n=t.hash.level:t.data&&null!=t.data.level&&(n=t.data.level),l[0]=n,e.log(...l)})}});
//# sourceMappingURL=../sourcemaps/helpers/log.js.map
