/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../utils","../exception"],function(t,e){"use strict";return function(a){a.registerHelper("each",function(a,n){if(!n)throw new e("Must pass iterator to #each");let o,l,i=n.fn,r=n.inverse,s=0,c="";function f(e,n,r){o&&(o.key=e,o.index=n,o.first=0===n,o.last=!!r,l&&(o.contextPath=l+e)),c+=i(a[e],{data:o,blockParams:t.blockParams([a[e],e],[l+e,null])})}if(n.data&&n.ids&&(l=t.appendContextPath(n.data.contextPath,n.ids[0])+"."),t.isFunction(a)&&(a=a.call(this)),n.data&&(o=t.createFrame(n.data)),a&&"object"==typeof a)if(t.isArray(a))for(let t=a.length;s<t;s++)s in a&&f(s,s,s===a.length-1);else if(global.Symbol&&a[global.Symbol.iterator]){const t=[],e=a[global.Symbol.iterator]();for(let a=e.next();!a.done;a=e.next())t.push(a.value);for(let e=(a=t).length;s<e;s++)f(s,s,s===a.length-1)}else{let t;Object.keys(a).forEach(e=>{void 0!==t&&f(t,s-1),t=e,s++}),void 0!==t&&f(t,s-1,!0)}return 0===s&&(c=r(this)),c})}});
//# sourceMappingURL=../sourcemaps/helpers/each.js.map
