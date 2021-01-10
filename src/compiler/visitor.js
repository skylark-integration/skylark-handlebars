define(['../exception'], function (Exception) {
    'use strict';
    function Visitor() {
        this.parents = [];
    }
    Visitor.prototype = {
        constructor: Visitor,
        mutating: false,
        acceptKey: function (node, name) {
            let value = this.accept(node[name]);
            if (this.mutating) {
                if (value && !Visitor.prototype[value.type]) {
                    throw new Exception('Unexpected node type "' + value.type + '" found when accepting ' + name + ' on ' + node.type);
                }
                node[name] = value;
            }
        },
        acceptRequired: function (node, name) {
            this.acceptKey(node, name);
            if (!node[name]) {
                throw new Exception(node.type + ' requires ' + name);
            }
        },
        acceptArray: function (array) {
            for (let i = 0, l = array.length; i < l; i++) {
                this.acceptKey(array, i);
                if (!array[i]) {
                    array.splice(i, 1);
                    i--;
                    l--;
                }
            }
        },
        accept: function (object) {
            if (!object) {
                return;
            }
            if (!this[object.type]) {
                throw new Exception('Unknown type: ' + object.type, object);
            }
            if (this.current) {
                this.parents.unshift(this.current);
            }
            this.current = object;
            let ret = this[object.type](object);
            this.current = this.parents.shift();
            if (!this.mutating || ret) {
                return ret;
            } else if (ret !== false) {
                return object;
            }
        },
        Program: function (program) {
            this.acceptArray(program.body);
        },
        MustacheStatement: visitSubExpression,
        Decorator: visitSubExpression,
        BlockStatement: visitBlock,
        DecoratorBlock: visitBlock,
        PartialStatement: visitPartial,
        PartialBlockStatement: function (partial) {
            visitPartial.call(this, partial);
            this.acceptKey(partial, 'program');
        },
        ContentStatement: function () {
        },
        CommentStatement: function () {
        },
        SubExpression: visitSubExpression,
        PathExpression: function () {
        },
        StringLiteral: function () {
        },
        NumberLiteral: function () {
        },
        BooleanLiteral: function () {
        },
        UndefinedLiteral: function () {
        },
        NullLiteral: function () {
        },
        Hash: function (hash) {
            this.acceptArray(hash.pairs);
        },
        HashPair: function (pair) {
            this.acceptRequired(pair, 'value');
        }
    };
    function visitSubExpression(mustache) {
        this.acceptRequired(mustache, 'path');
        this.acceptArray(mustache.params);
        this.acceptKey(mustache, 'hash');
    }
    function visitBlock(block) {
        visitSubExpression.call(this, block);
        this.acceptKey(block, 'program');
        this.acceptKey(block, 'inverse');
    }
    function visitPartial(partial) {
        this.acceptRequired(partial, 'name');
        this.acceptArray(partial.params);
        this.acceptKey(partial, 'hash');
    }
    return Visitor;
});