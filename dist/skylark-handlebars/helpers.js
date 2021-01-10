/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["./helpers/block-helper-missing","./helpers/each","./helpers/helper-missing","./helpers/if","./helpers/log","./helpers/lookup","./helpers/with"],function(e,s,l,r,h,p,o){"use strict";return{registerDefaultHelpers:function(i){e(i),s(i),l(i),r(i),h(i),p(i),o(i)},moveHelperToHooks:function(e,s,l){e.helpers[s]&&(e.hooks[s]=e.helpers[s],l||delete e.helpers[s])}}});
//# sourceMappingURL=sourcemaps/helpers.js.map
