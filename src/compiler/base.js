define([
    './parser',
    './whitespace-control',
    './helpers',
    '../utils'
], function (parser, WhitespaceControl, Helpers, a) {
    'use strict';
    let yy = {};
    a.extend(yy, Helpers);
    function parseWithoutProcessing(input, options) {
        if (input.type === 'Program') {
            return input;
        }
        parser.yy = yy;
        yy.locInfo = function (locInfo) {
            return new yy.SourceLocation(options && options.srcName, locInfo);
        };
        let ast = parser.parse(input);
        return ast;
    }
    function parse(input, options) {
        let ast = parseWithoutProcessing(input, options);
        let strip = new WhitespaceControl(options);
        return strip.accept(ast);
    }
    return {
        parser,
        parseWithoutProcessing: parseWithoutProcessing,
        parse: parse
    };
});