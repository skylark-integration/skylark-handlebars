/**
 * skylark-handlebars - A version of handlebars.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-handlebars/
 * @license MIT
 */
define(["../base","../exception","../utils","./code-gen"],function(t,s,e,i){"use strict";function n(t){this.value=t}function o(){}return o.prototype={nameLookup:function(t,s){return this.internalNameLookup(t,s)},depthedLookup:function(t){return[this.aliasable("container.lookup"),'(depths, "',t,'")']},compilerInfo:function(){const s=t.COMPILER_REVISION;return[s,t.REVISION_CHANGES[s]]},appendToBuffer:function(t,s,i){return e.isArray(t)||(t=[t]),t=this.source.wrap(t,s),this.environment.isSimple?["return ",t,";"]:i?["buffer += ",t,";"]:(t.appendToBuffer=!0,t)},initializeBuffer:function(){return this.quotedString("")},internalNameLookup:function(t,s){return this.lookupPropertyFunctionIsUsed=!0,["lookupProperty(",t,",",JSON.stringify(s),")"]},lookupPropertyFunctionIsUsed:!1,compile:function(t,e,i,n){this.environment=t,this.options=e,this.stringParams=this.options.stringParams,this.trackIds=this.options.trackIds,this.precompile=!n,this.name=this.environment.name,this.isChild=!!i,this.context=i||{decorators:[],programs:[],environments:[]},this.preamble(),this.stackSlot=0,this.stackVars=[],this.aliases={},this.registers={list:[]},this.hashes=[],this.compileStack=[],this.inlineStack=[],this.blockParams=[],this.compileChildren(t,e),this.useDepths=this.useDepths||t.useDepths||t.useDecorators||this.options.compat,this.useBlockParams=this.useBlockParams||t.useBlockParams;let o,r,a,h,c=t.opcodes;for(a=0,h=c.length;a<h;a++)o=c[a],this.source.currentLocation=o.loc,r=r||o.loc,this[o.opcode].apply(this,o.args);if(this.source.currentLocation=r,this.pushSource(""),this.stackSlot||this.inlineStack.length||this.compileStack.length)throw new s("Compile completed with content left on stack");this.decorators.isEmpty()?this.decorators=void 0:(this.useDecorators=!0,this.decorators.prepend(["var decorators = container.decorators, ",this.lookupPropertyFunctionVarDeclaration(),";\n"]),this.decorators.push("return fn;"),n?this.decorators=Function.apply(this,["fn","props","container","depth0","data","blockParams","depths",this.decorators.merge()]):(this.decorators.prepend("function(fn, props, container, depth0, data, blockParams, depths) {\n"),this.decorators.push("}\n"),this.decorators=this.decorators.merge()));let p=this.createFunctionContext(n);if(this.isChild)return p;{let t={compiler:this.compilerInfo(),main:p};this.decorators&&(t.main_d=this.decorators,t.useDecorators=!0);let{programs:s,decorators:i}=this.context;for(a=0,h=s.length;a<h;a++)s[a]&&(t[a]=s[a],i[a]&&(t[a+"_d"]=i[a],t.useDecorators=!0));return this.environment.usePartial&&(t.usePartial=!0),this.options.data&&(t.useData=!0),this.useDepths&&(t.useDepths=!0),this.useBlockParams&&(t.useBlockParams=!0),this.options.compat&&(t.compat=!0),n?t.compilerOptions=this.options:(t.compiler=JSON.stringify(t.compiler),this.source.currentLocation={start:{line:1,column:0}},t=this.objectLiteral(t),e.srcName?(t=t.toStringWithSourceMap({file:e.destName})).map=t.map&&t.map.toString():t=t.toString()),t}},preamble:function(){this.lastContext=0,this.source=new i(this.options.srcName),this.decorators=new i(this.options.srcName)},createFunctionContext:function(t){let s="",e=this.stackVars.concat(this.registers.list);e.length>0&&(s+=", "+e.join(", "));let i=0;Object.keys(this.aliases).forEach(t=>{let e=this.aliases[t];e.children&&e.referenceCount>1&&(s+=", alias"+ ++i+"="+t,e.children[0]="alias"+i)}),this.lookupPropertyFunctionIsUsed&&(s+=", "+this.lookupPropertyFunctionVarDeclaration());let n=["container","depth0","helpers","partials","data"];(this.useBlockParams||this.useDepths)&&n.push("blockParams"),this.useDepths&&n.push("depths");let o=this.mergeSource(s);return t?(n.push(o),Function.apply(this,n)):this.source.wrap(["function(",n.join(","),") {\n  ",o,"}"])},mergeSource:function(t){let s,e,i,n,o=this.environment.isSimple,r=!this.forceBuffer;return this.source.each(t=>{t.appendToBuffer?(i?t.prepend("  + "):i=t,n=t):(i&&(e?i.prepend("buffer += "):s=!0,n.add(";"),i=n=void 0),e=!0,o||(r=!1))}),r?i?(i.prepend("return "),n.add(";")):e||this.source.push('return "";'):(t+=", buffer = "+(s?"":this.initializeBuffer()),i?(i.prepend("return buffer + "),n.add(";")):this.source.push("return buffer;")),t&&this.source.prepend("var "+t.substring(2)+(s?"":";\n")),this.source.merge()},lookupPropertyFunctionVarDeclaration:function(){return"\n      lookupProperty = container.lookupProperty || function(parent, propertyName) {\n        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {\n          return parent[propertyName];\n        }\n        return undefined\n    }\n    ".trim()},blockValue:function(t){let s=this.aliasable("container.hooks.blockHelperMissing"),e=[this.contextName(0)];this.setupHelperArgs(t,0,e);let i=this.popStack();e.splice(1,0,i),this.push(this.source.functionCall(s,"call",e))},ambiguousBlockValue:function(){let t=this.aliasable("container.hooks.blockHelperMissing"),s=[this.contextName(0)];this.setupHelperArgs("",0,s,!0),this.flushInline();let e=this.topStack();s.splice(1,0,e),this.pushSource(["if (!",this.lastHelper,") { ",e," = ",this.source.functionCall(t,"call",s),"}"])},appendContent:function(t){this.pendingContent?t=this.pendingContent+t:this.pendingLocation=this.source.currentLocation,this.pendingContent=t},append:function(){if(this.isInline())this.replaceStack(t=>[" != null ? ",t,' : ""']),this.pushSource(this.appendToBuffer(this.popStack()));else{let t=this.popStack();this.pushSource(["if (",t," != null) { ",this.appendToBuffer(t,void 0,!0)," }"]),this.environment.isSimple&&this.pushSource(["else { ",this.appendToBuffer("''",void 0,!0)," }"])}},appendEscaped:function(){this.pushSource(this.appendToBuffer([this.aliasable("container.escapeExpression"),"(",this.popStack(),")"]))},getContext:function(t){this.lastContext=t},pushContext:function(){this.pushStackLiteral(this.contextName(this.lastContext))},lookupOnContext:function(t,s,e,i){let n=0;i||!this.options.compat||this.lastContext?this.pushContext():this.push(this.depthedLookup(t[n++])),this.resolvePath("context",t,n,s,e)},lookupBlockParam:function(t,s){this.useBlockParams=!0,this.push(["blockParams[",t[0],"][",t[1],"]"]),this.resolvePath("context",s,1)},lookupData:function(t,s,e){t?this.pushStackLiteral("container.data(data, "+t+")"):this.pushStackLiteral("data"),this.resolvePath("data",s,0,!0,e)},resolvePath:function(t,s,e,i,n){if(this.options.strict||this.options.assumeObjects)return void this.push(function(t,s,e,i){let n=s.popStack(),o=0,r=e.length;t&&r--;for(;o<r;o++)n=s.nameLookup(n,e[o],i);return t?[s.aliasable("container.strict"),"(",n,", ",s.quotedString(e[o]),", ",JSON.stringify(s.source.currentLocation)," )"]:n}(this.options.strict&&n,this,s,t));let o=s.length;for(;e<o;e++)this.replaceStack(n=>{let o=this.nameLookup(n,s[e],t);return i?[" && ",o]:[" != null ? ",o," : ",n]})},resolvePossibleLambda:function(){this.push([this.aliasable("container.lambda"),"(",this.popStack(),", ",this.contextName(0),")"])},pushStringParam:function(t,s){this.pushContext(),this.pushString(s),"SubExpression"!==s&&("string"==typeof t?this.pushString(t):this.pushStackLiteral(t))},emptyHash:function(t){this.trackIds&&this.push("{}"),this.stringParams&&(this.push("{}"),this.push("{}")),this.pushStackLiteral(t?"undefined":"{}")},pushHash:function(){this.hash&&this.hashes.push(this.hash),this.hash={values:{},types:[],contexts:[],ids:[]}},popHash:function(){let t=this.hash;this.hash=this.hashes.pop(),this.trackIds&&this.push(this.objectLiteral(t.ids)),this.stringParams&&(this.push(this.objectLiteral(t.contexts)),this.push(this.objectLiteral(t.types))),this.push(this.objectLiteral(t.values))},pushString:function(t){this.pushStackLiteral(this.quotedString(t))},pushLiteral:function(t){this.pushStackLiteral(t)},pushProgram:function(t){null!=t?this.pushStackLiteral(this.programExpression(t)):this.pushStackLiteral(null)},registerDecorator(t,s){let e=this.nameLookup("decorators",s,"decorator"),i=this.setupHelperArgs(s,t);this.decorators.push(["fn = ",this.decorators.functionCall(e,"",["fn","props","container",i])," || fn;"])},invokeHelper:function(t,s,e){let i=this.popStack(),n=this.setupHelper(t,s),o=[];e&&o.push(n.name),o.push(i),this.options.strict||o.push(this.aliasable("container.hooks.helperMissing"));let r=["(",this.itemsSeparatedBy(o,"||"),")"],a=this.source.functionCall(r,"call",n.callParams);this.push(a)},itemsSeparatedBy:function(t,s){let e=[];e.push(t[0]);for(let i=1;i<t.length;i++)e.push(s,t[i]);return e},invokeKnownHelper:function(t,s){let e=this.setupHelper(t,s);this.push(this.source.functionCall(e.name,"call",e.callParams))},invokeAmbiguous:function(t,s){this.useRegister("helper");let e=this.popStack();this.emptyHash();let i=this.setupHelper(0,t,s),n=["(","(helper = ",this.lastHelper=this.nameLookup("helpers",t,"helper")," || ",e,")"];this.options.strict||(n[0]="(helper = ",n.push(" != null ? helper : ",this.aliasable("container.hooks.helperMissing"))),this.push(["(",n,i.paramsInit?["),(",i.paramsInit]:[],"),","(typeof helper === ",this.aliasable('"function"')," ? ",this.source.functionCall("helper","call",i.callParams)," : helper))"])},invokePartial:function(t,s,e){let i=[],n=this.setupParams(s,1,i);t&&(s=this.popStack(),delete n.name),e&&(n.indent=JSON.stringify(e)),n.helpers="helpers",n.partials="partials",n.decorators="container.decorators",t?i.unshift(s):i.unshift(this.nameLookup("partials",s,"partial")),this.options.compat&&(n.depths="depths"),n=this.objectLiteral(n),i.push(n),this.push(this.source.functionCall("container.invokePartial","",i))},assignToHash:function(t){let s,e,i,n=this.popStack();this.trackIds&&(i=this.popStack()),this.stringParams&&(e=this.popStack(),s=this.popStack());let o=this.hash;s&&(o.contexts[t]=s),e&&(o.types[t]=e),i&&(o.ids[t]=i),o.values[t]=n},pushId:function(t,s,e){"BlockParam"===t?this.pushStackLiteral("blockParams["+s[0]+"].path["+s[1]+"]"+(e?" + "+JSON.stringify("."+e):"")):"PathExpression"===t?this.pushString(s):"SubExpression"===t?this.pushStackLiteral("true"):this.pushStackLiteral("null")},compiler:o,compileChildren:function(t,s){let e,i,n=t.children;for(let t=0,o=n.length;t<o;t++){e=n[t],i=new this.compiler;let o=this.matchExistingProgram(e);if(null==o){this.context.programs.push("");let t=this.context.programs.length;e.index=t,e.name="program"+t,this.context.programs[t]=i.compile(e,s,this.context,!this.precompile),this.context.decorators[t]=i.decorators,this.context.environments[t]=e,this.useDepths=this.useDepths||i.useDepths,this.useBlockParams=this.useBlockParams||i.useBlockParams,e.useDepths=this.useDepths,e.useBlockParams=this.useBlockParams}else e.index=o.index,e.name="program"+o.index,this.useDepths=this.useDepths||o.useDepths,this.useBlockParams=this.useBlockParams||o.useBlockParams}},matchExistingProgram:function(t){for(let s=0,e=this.context.environments.length;s<e;s++){let e=this.context.environments[s];if(e&&e.equals(t))return e}},programExpression:function(t){let s=this.environment.children[t],e=[s.index,"data",s.blockParams];return(this.useBlockParams||this.useDepths)&&e.push("blockParams"),this.useDepths&&e.push("depths"),"container.program("+e.join(", ")+")"},useRegister:function(t){this.registers[t]||(this.registers[t]=!0,this.registers.list.push(t))},push:function(t){return t instanceof n||(t=this.source.wrap(t)),this.inlineStack.push(t),t},pushStackLiteral:function(t){this.push(new n(t))},pushSource:function(t){this.pendingContent&&(this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent),this.pendingLocation)),this.pendingContent=void 0),t&&this.source.push(t)},replaceStack:function(t){let e,i,o,r=["("];if(!this.isInline())throw new s("replaceStack on non-inline");let a=this.popStack(!0);if(a instanceof n)r=["(",e=[a.value]],o=!0;else{i=!0;let t=this.incrStack();r=["((",this.push(t)," = ",a,")"],e=this.topStack()}let h=t.call(this,e);o||this.popStack(),i&&this.stackSlot--,this.push(r.concat(h,")"))},incrStack:function(){return this.stackSlot++,this.stackSlot>this.stackVars.length&&this.stackVars.push("stack"+this.stackSlot),this.topStackName()},topStackName:function(){return"stack"+this.stackSlot},flushInline:function(){let t=this.inlineStack;this.inlineStack=[];for(let s=0,e=t.length;s<e;s++){let e=t[s];if(e instanceof n)this.compileStack.push(e);else{let t=this.incrStack();this.pushSource([t," = ",e,";"]),this.compileStack.push(t)}}},isInline:function(){return this.inlineStack.length},popStack:function(t){let e=this.isInline(),i=(e?this.inlineStack:this.compileStack).pop();if(!t&&i instanceof n)return i.value;if(!e){if(!this.stackSlot)throw new s("Invalid stack pop");this.stackSlot--}return i},topStack:function(){let t=this.isInline()?this.inlineStack:this.compileStack,s=t[t.length-1];return s instanceof n?s.value:s},contextName:function(t){return this.useDepths&&t?"depths["+t+"]":"depth"+t},quotedString:function(t){return this.source.quotedString(t)},objectLiteral:function(t){return this.source.objectLiteral(t)},aliasable:function(t){let s=this.aliases[t];return s?(s.referenceCount++,s):((s=this.aliases[t]=this.source.wrap(t)).aliasable=!0,s.referenceCount=1,s)},setupHelper:function(t,s,e){let i=[];return{params:i,paramsInit:this.setupHelperArgs(s,t,i,e),name:this.nameLookup("helpers",s,"helper"),callParams:[this.aliasable(`${this.contextName(0)} != null ? ${this.contextName(0)} : (container.nullContext || {})`)].concat(i)}},setupParams:function(t,s,e){let i,n={},o=[],r=[],a=[],h=!e;h&&(e=[]),n.name=this.quotedString(t),n.hash=this.popStack(),this.trackIds&&(n.hashIds=this.popStack()),this.stringParams&&(n.hashTypes=this.popStack(),n.hashContexts=this.popStack());let c=this.popStack(),p=this.popStack();(p||c)&&(n.fn=p||"container.noop",n.inverse=c||"container.noop");let u=s;for(;u--;)i=this.popStack(),e[u]=i,this.trackIds&&(a[u]=this.popStack()),this.stringParams&&(r[u]=this.popStack(),o[u]=this.popStack());return h&&(n.args=this.source.generateArray(e)),this.trackIds&&(n.ids=this.source.generateArray(a)),this.stringParams&&(n.types=this.source.generateArray(r),n.contexts=this.source.generateArray(o)),this.options.data&&(n.data="data"),this.useBlockParams&&(n.blockParams="blockParams"),n},setupHelperArgs:function(t,s,e,i){let n=this.setupParams(t,s,e);return n.loc=JSON.stringify(this.source.currentLocation),n=this.objectLiteral(n),i?(this.useRegister("options"),e.push("options"),["options=",n]):e?(e.push(n),""):n}},function(){const t="break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield await null true false".split(" "),s=o.RESERVED_WORDS={};for(let e=0,i=t.length;e<i;e++)s[t[e]]=!0}(),o.isValidJavaScriptVariableName=function(t){return!o.RESERVED_WORDS[t]&&/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(t)},o});
//# sourceMappingURL=../sourcemaps/compiler/javascript-compiler.js.map
