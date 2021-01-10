/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["./create-new-lookup-object","../logger"],function(e,t){"use strict";const o=Object.create(null);function r(e,r){return void 0!==e.whitelist[r]?!0===e.whitelist[r]:void 0!==e.defaultValue?e.defaultValue:(function(e){!0!==o[e]&&(o[e]=!0,t.log("error",`Handlebars: Access has been denied to resolve the property "${e}" because it is not an "own property" of its parent.\n`+"You can add a runtime option to disable the check or this warning:\nSee https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details"))}(r),!1)}return{createProtoAccessControl:function(t){let o=Object.create(null);o.constructor=!1,o.__defineGetter__=!1,o.__defineSetter__=!1,o.__lookupGetter__=!1;let r=Object.create(null);return r.__proto__=!1,{properties:{whitelist:e.createNewLookupObject(r,t.allowedProtoProperties),defaultValue:t.allowProtoPropertiesByDefault},methods:{whitelist:e.createNewLookupObject(o,t.allowedProtoMethods),defaultValue:t.allowProtoMethodsByDefault}}},resultIsAllowed:function(e,t,o){return r("function"==typeof e?t.methods:t.properties,o)},resetLoggedProperties:function(){Object.keys(o).forEach(e=>{delete o[e]})}}});
//# sourceMappingURL=../sourcemaps/internal/proto-access.js.map
