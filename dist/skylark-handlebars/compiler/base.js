/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["./parser","./whitespace-control","./helpers","../utils"],function(e,r,t,n){"use strict";let c={};function o(r,t){if("Program"===r.type)return r;return e.yy=c,c.locInfo=function(e){return new c.SourceLocation(t&&t.srcName,e)},e.parse(r)}return n.extend(c,t),{parser:e,parseWithoutProcessing:o,parse:function(e,t){let n=o(e,t);return new r(t).accept(n)}}});
//# sourceMappingURL=../sourcemaps/compiler/base.js.map
