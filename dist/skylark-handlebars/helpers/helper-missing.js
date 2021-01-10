/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../exception"],function(e){"use strict";return function(n){n.registerHelper("helperMissing",function(){if(1!==arguments.length)throw new e('Missing helper: "'+arguments[arguments.length-1].name+'"')})}});
//# sourceMappingURL=../sourcemaps/helpers/helper-missing.js.map
