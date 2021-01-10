/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../utils","../exception"],function(e,n){"use strict";return function(i){i.registerHelper("if",function(i,t){if(2!=arguments.length)throw new n("#if requires exactly one argument");return e.isFunction(i)&&(i=i.call(this)),!t.hash.includeZero&&!i||e.isEmpty(i)?t.inverse(this):t.fn(this)}),i.registerHelper("unless",function(e,t){if(2!=arguments.length)throw new n("#unless requires exactly one argument");return i.helpers.if.call(this,e,{fn:t.inverse,inverse:t.fn,hash:t.hash})})}});
//# sourceMappingURL=../sourcemaps/helpers/if.js.map
