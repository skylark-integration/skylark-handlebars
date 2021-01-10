/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["./visitor"],function(t){"use strict";function e(t={}){this.options=t}function n(t,e,n){void 0===e&&(e=t.length);let o=t[e-1],r=t[e-2];return o?"ContentStatement"===o.type?(r||!n?/\r?\n\s*?$/:/(^|\r?\n)\s*?$/).test(o.original):void 0:n}function o(t,e,n){void 0===e&&(e=-1);let o=t[e+1],r=t[e+2];return o?"ContentStatement"===o.type?(r||!n?/^\s*?\r?\n/:/^\s*?(\r?\n|$)/).test(o.original):void 0:n}function r(t,e,n){let o=t[null==e?0:e+1];if(!o||"ContentStatement"!==o.type||!n&&o.rightStripped)return;let r=o.value;o.value=o.value.replace(n?/^\s+/:/^[ \t]*\r?\n?/,""),o.rightStripped=o.value!==r}function l(t,e,n){let o=t[null==e?t.length-1:e-1];if(!o||"ContentStatement"!==o.type||!n&&o.leftStripped)return;let r=o.value;return o.value=o.value.replace(n?/\s+$/:/[ \t]+$/,""),o.leftStripped=o.value!==r,o.leftStripped}return e.prototype=new t,e.prototype.Program=function(t){const e=!this.options.ignoreStandalone;let i=!this.isRootSeen;this.isRootSeen=!0;let p=t.body;for(let t=0,a=p.length;t<a;t++){let a=p[t],s=this.accept(a);if(!s)continue;let c=n(p,t,i),d=o(p,t,i),u=s.openStandalone&&c,y=s.closeStandalone&&d,S=s.inlineStandalone&&c&&d;s.close&&r(p,t,!0),s.open&&l(p,t,!0),e&&S&&(r(p,t),l(p,t)&&"PartialStatement"===a.type&&(a.indent=/([ \t]+$)/.exec(p[t-1].original)[1])),e&&u&&(r((a.program||a.inverse).body),l(p,t)),e&&y&&(r(p,t),l((a.inverse||a.program).body))}return t},e.prototype.BlockStatement=e.prototype.DecoratorBlock=e.prototype.PartialBlockStatement=function(t){this.accept(t.program),this.accept(t.inverse);let e=t.program||t.inverse,i=t.program&&t.inverse,p=i,a=i;if(i&&i.chained)for(p=i.body[0].program;a.chained;)a=a.body[a.body.length-1].program;let s={open:t.openStrip.open,close:t.closeStrip.close,openStandalone:o(e.body),closeStandalone:n((p||e).body)};if(t.openStrip.close&&r(e.body,null,!0),i){let i=t.inverseStrip;i.open&&l(e.body,null,!0),i.close&&r(p.body,null,!0),t.closeStrip.open&&l(a.body,null,!0),!this.options.ignoreStandalone&&n(e.body)&&o(p.body)&&(l(e.body),r(p.body))}else t.closeStrip.open&&l(e.body,null,!0);return s},e.prototype.Decorator=e.prototype.MustacheStatement=function(t){return t.strip},e.prototype.PartialStatement=e.prototype.CommentStatement=function(t){let e=t.strip||{};return{inlineStandalone:!0,open:e.open,close:e.close}},e});
//# sourceMappingURL=../sourcemaps/compiler/whitespace-control.js.map
