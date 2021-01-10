/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../exception"],function(t){"use strict";function e(){this.parents=[]}function n(t){this.acceptRequired(t,"path"),this.acceptArray(t.params),this.acceptKey(t,"hash")}function i(t){n.call(this,t),this.acceptKey(t,"program"),this.acceptKey(t,"inverse")}function c(t){this.acceptRequired(t,"name"),this.acceptArray(t.params),this.acceptKey(t,"hash")}return e.prototype={constructor:e,mutating:!1,acceptKey:function(n,i){let c=this.accept(n[i]);if(this.mutating){if(c&&!e.prototype[c.type])throw new t('Unexpected node type "'+c.type+'" found when accepting '+i+" on "+n.type);n[i]=c}},acceptRequired:function(e,n){if(this.acceptKey(e,n),!e[n])throw new t(e.type+" requires "+n)},acceptArray:function(t){for(let e=0,n=t.length;e<n;e++)this.acceptKey(t,e),t[e]||(t.splice(e,1),e--,n--)},accept:function(e){if(!e)return;if(!this[e.type])throw new t("Unknown type: "+e.type,e);this.current&&this.parents.unshift(this.current),this.current=e;let n=this[e.type](e);return this.current=this.parents.shift(),!this.mutating||n?n:!1!==n?e:void 0},Program:function(t){this.acceptArray(t.body)},MustacheStatement:n,Decorator:n,BlockStatement:i,DecoratorBlock:i,PartialStatement:c,PartialBlockStatement:function(t){c.call(this,t),this.acceptKey(t,"program")},ContentStatement:function(){},CommentStatement:function(){},SubExpression:n,PathExpression:function(){},StringLiteral:function(){},NumberLiteral:function(){},BooleanLiteral:function(){},UndefinedLiteral:function(){},NullLiteral:function(){},Hash:function(t){this.acceptArray(t.pairs)},HashPair:function(t){this.acceptRequired(t,"value")}},e});
//# sourceMappingURL=../sourcemaps/compiler/visitor.js.map
