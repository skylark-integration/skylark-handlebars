/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../utils"],function(t){"use strict";return function(e){e.registerHelper("blockHelperMissing",function(n,i){let r=i.inverse,a=i.fn;if(!0===n)return a(this);if(!1===n||null==n)return r(this);if(t.isArray(n))return n.length>0?(i.ids&&(i.ids=[i.name]),e.helpers.each(n,i)):r(this);if(i.data&&i.ids){let e=t.createFrame(i.data);e.contextPath=t.appendContextPath(i.data.contextPath,i.name),i={data:e}}return a(n,i)})}});
//# sourceMappingURL=../sourcemaps/helpers/block-helper-missing.js.map
