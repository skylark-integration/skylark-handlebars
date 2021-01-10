/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../utils"],function(t){"use strict";return function(r){r.registerDecorator("inline",function(r,i,a,n){let e=r;return i.partials||(i.partials={},e=function(n,e){let l=a.partials;a.partials=t.extend({},l,i.partials);let s=r(n,e);return a.partials=l,s}),i.partials[n.args[0]]=n.fn,e})}});
//# sourceMappingURL=../sourcemaps/decorators/inline.js.map
