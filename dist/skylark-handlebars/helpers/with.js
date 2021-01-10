/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../utils","../exception"],function(t,e){"use strict";return function(a){a.registerHelper("with",function(a,n){if(2!=arguments.length)throw new e("#with requires exactly one argument");t.isFunction(a)&&(a=a.call(this));let i=n.fn;if(t.isEmpty(a))return n.inverse(this);{let e=n.data;return n.data&&n.ids&&((e=t.createFrame(n.data)).contextPath=t.appendContextPath(n.data.contextPath,n.ids[0])),i(a,{data:e,blockParams:t.blockParams([a],[e&&e.contextPath])})}})}});
//# sourceMappingURL=../sourcemaps/helpers/with.js.map
