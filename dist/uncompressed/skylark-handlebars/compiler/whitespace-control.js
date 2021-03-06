define(['./visitor'], function (Visitor) {
    'use strict';
    function WhitespaceControl(options = {}) {
        this.options = options;
    }
    WhitespaceControl.prototype = new Visitor();
    WhitespaceControl.prototype.Program = function (program) {
        const doStandalone = !this.options.ignoreStandalone;
        let isRoot = !this.isRootSeen;
        this.isRootSeen = true;
        let body = program.body;
        for (let i = 0, l = body.length; i < l; i++) {
            let current = body[i], strip = this.accept(current);
            if (!strip) {
                continue;
            }
            let _isPrevWhitespace = isPrevWhitespace(body, i, isRoot), _isNextWhitespace = isNextWhitespace(body, i, isRoot), openStandalone = strip.openStandalone && _isPrevWhitespace, closeStandalone = strip.closeStandalone && _isNextWhitespace, inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;
            if (strip.close) {
                omitRight(body, i, true);
            }
            if (strip.open) {
                omitLeft(body, i, true);
            }
            if (doStandalone && inlineStandalone) {
                omitRight(body, i);
                if (omitLeft(body, i)) {
                    if (current.type === 'PartialStatement') {
                        current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
                    }
                }
            }
            if (doStandalone && openStandalone) {
                omitRight((current.program || current.inverse).body);
                omitLeft(body, i);
            }
            if (doStandalone && closeStandalone) {
                omitRight(body, i);
                omitLeft((current.inverse || current.program).body);
            }
        }
        return program;
    };
    WhitespaceControl.prototype.BlockStatement = WhitespaceControl.prototype.DecoratorBlock = WhitespaceControl.prototype.PartialBlockStatement = function (block) {
        this.accept(block.program);
        this.accept(block.inverse);
        let program = block.program || block.inverse, inverse = block.program && block.inverse, firstInverse = inverse, lastInverse = inverse;
        if (inverse && inverse.chained) {
            firstInverse = inverse.body[0].program;
            while (lastInverse.chained) {
                lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
            }
        }
        let strip = {
            open: block.openStrip.open,
            close: block.closeStrip.close,
            openStandalone: isNextWhitespace(program.body),
            closeStandalone: isPrevWhitespace((firstInverse || program).body)
        };
        if (block.openStrip.close) {
            omitRight(program.body, null, true);
        }
        if (inverse) {
            let inverseStrip = block.inverseStrip;
            if (inverseStrip.open) {
                omitLeft(program.body, null, true);
            }
            if (inverseStrip.close) {
                omitRight(firstInverse.body, null, true);
            }
            if (block.closeStrip.open) {
                omitLeft(lastInverse.body, null, true);
            }
            if (!this.options.ignoreStandalone && isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
                omitLeft(program.body);
                omitRight(firstInverse.body);
            }
        } else if (block.closeStrip.open) {
            omitLeft(program.body, null, true);
        }
        return strip;
    };
    WhitespaceControl.prototype.Decorator = WhitespaceControl.prototype.MustacheStatement = function (mustache) {
        return mustache.strip;
    };
    WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function (node) {
        let strip = node.strip || {};
        return {
            inlineStandalone: true,
            open: strip.open,
            close: strip.close
        };
    };
    function isPrevWhitespace(body, i, isRoot) {
        if (i === undefined) {
            i = body.length;
        }
        let prev = body[i - 1], sibling = body[i - 2];
        if (!prev) {
            return isRoot;
        }
        if (prev.type === 'ContentStatement') {
            return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
        }
    }
    function isNextWhitespace(body, i, isRoot) {
        if (i === undefined) {
            i = -1;
        }
        let next = body[i + 1], sibling = body[i + 2];
        if (!next) {
            return isRoot;
        }
        if (next.type === 'ContentStatement') {
            return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
        }
    }
    function omitRight(body, i, multiple) {
        let current = body[i == null ? 0 : i + 1];
        if (!current || current.type !== 'ContentStatement' || !multiple && current.rightStripped) {
            return;
        }
        let original = current.value;
        current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, '');
        current.rightStripped = current.value !== original;
    }
    function omitLeft(body, i, multiple) {
        let current = body[i == null ? body.length - 1 : i - 1];
        if (!current || current.type !== 'ContentStatement' || !multiple && current.leftStripped) {
            return;
        }
        let original = current.value;
        current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, '');
        current.leftStripped = current.value !== original;
        return current.leftStripped;
    }
    return WhitespaceControl;
});