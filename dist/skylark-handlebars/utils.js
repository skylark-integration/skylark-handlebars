/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(function(){"use strict";const t={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;","=":"&#x3D;"},n=/[&<>"'`=]/g,r=/[&<>"'`=]/;function e(n){return t[n]}function o(t){for(let n=1;n<arguments.length;n++)for(let r in arguments[n])Object.prototype.hasOwnProperty.call(arguments[n],r)&&(t[r]=arguments[n][r]);return t}let u=Object.prototype.toString,i=function(t){return"function"==typeof t};i(/x/)&&(i=function(t){return"function"==typeof t&&"[object Function]"===u.call(t)});const c=Array.isArray||function(t){return!(!t||"object"!=typeof t)&&"[object Array]"===u.call(t)};return{extend:o,toString:u,isFunction:i,isArray:c,indexOf:function(t,n){for(let r=0,e=t.length;r<e;r++)if(t[r]===n)return r;return-1},escapeExpression:function(t){if("string"!=typeof t){if(t&&t.toHTML)return t.toHTML();if(null==t)return"";if(!t)return t+"";t=""+t}return r.test(t)?t.replace(n,e):t},isEmpty:function(t){return!t&&0!==t||!(!c(t)||0!==t.length)},createFrame:function(t){let n=o({},t);return n._parent=t,n},blockParams:function(t,n){return t.path=n,t},appendContextPath:function(t,n){return(t?t+".":"")+n}}});
//# sourceMappingURL=sourcemaps/utils.js.map
