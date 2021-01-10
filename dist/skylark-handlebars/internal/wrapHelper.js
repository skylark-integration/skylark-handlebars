/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(function(){"use strict";return{wrapHelper:function(n,t){return"function"!=typeof n?n:function(){const e=arguments[arguments.length-1];return arguments[arguments.length-1]=t(e),n.apply(this,arguments)}}}});
//# sourceMappingURL=../sourcemaps/internal/wrapHelper.js.map
