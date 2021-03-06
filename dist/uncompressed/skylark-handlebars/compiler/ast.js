define(function () {
    'use strict';
    let AST = {
        helpers: {
            helperExpression: function (node) {
                return node.type === 'SubExpression' || (node.type === 'MustacheStatement' || node.type === 'BlockStatement') && !!(node.params && node.params.length || node.hash);
            },
            scopedId: function (path) {
                return /^\.|this\b/.test(path.original);
            },
            simpleId: function (path) {
                return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
            }
        }
    };
    return AST;
});