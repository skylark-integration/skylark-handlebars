/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["./utils","./exception","./helpers","./decorators","./logger","./internal/proto-access"],function(e,t,r,i,o,s){"use strict";function l(e,t,o){this.helpers=e||{},this.partials=t||{},this.decorators=o||{},r.registerDefaultHelpers(this),i.registerDefaultDecorators(this)}return l.prototype={constructor:l,logger:o,log:o.log,registerHelper:function(r,i){if("[object Object]"===e.toString.call(r)){if(i)throw new t("Arg not supported with multiple helpers");e.extend(this.helpers,r)}else this.helpers[r]=i},unregisterHelper:function(e){delete this.helpers[e]},registerPartial:function(r,i){if("[object Object]"===e.toString.call(r))e.extend(this.partials,r);else{if(void 0===i)throw new t(`Attempting to register a partial called "${r}" as undefined`);this.partials[r]=i}},unregisterPartial:function(e){delete this.partials[e]},registerDecorator:function(r,i){if("[object Object]"===e.toString.call(r)){if(i)throw new t("Arg not supported with multiple decorators");e.extend(this.decorators,r)}else this.decorators[r]=i},unregisterDecorator:function(e){delete this.decorators[e]},resetLoggedPropertyAccesses:function(){s.resetLoggedProperties()}},{VERSION:"4.7.6",COMPILER_REVISION:8,LAST_COMPATIBLE_COMPILER_REVISION:7,REVISION_CHANGES:{1:"<= 1.0.rc.2",2:"== 1.0.0-rc.3",3:"== 1.0.0-rc.4",4:"== 1.x.x",5:"== 2.0.0-alpha.x",6:">= 2.0.0-beta.1",7:">= 4.0.0 <4.3.0",8:">= 4.3.0"},HandlebarsEnvironment:l,log:o.log,createFrame:e.createFrame,logger:o}});
//# sourceMappingURL=sourcemaps/base.js.map
