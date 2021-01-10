define(function () {
    'use strict';
    const escape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    const badChars = /[&<>"'`=]/g, possible = /[&<>"'`=]/;
    function escapeChar(chr) {
        return escape[chr];
    }
    function extend(obj) {
        for (let i = 1; i < arguments.length; i++) {
            for (let key in arguments[i]) {
                if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
                    obj[key] = arguments[i][key];
                }
            }
        }
        return obj;
    }
    let toString = Object.prototype.toString;
    let isFunction = function (value) {
        return typeof value === 'function';
    };
    if (isFunction(/x/)) {
        isFunction = function (value) {
            return typeof value === 'function' && toString.call(value) === '[object Function]';
        };
    }
    const isArray = Array.isArray || function (value) {
        return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
    };
    function indexOf(array, value) {
        for (let i = 0, len = array.length; i < len; i++) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }
    function escapeExpression(string) {
        if (typeof string !== 'string') {
            if (string && string.toHTML) {
                return string.toHTML();
            } else if (string == null) {
                return '';
            } else if (!string) {
                return string + '';
            }
            string = '' + string;
        }
        if (!possible.test(string)) {
            return string;
        }
        return string.replace(badChars, escapeChar);
    }
    function isEmpty(value) {
        if (!value && value !== 0) {
            return true;
        } else if (isArray(value) && value.length === 0) {
            return true;
        } else {
            return false;
        }
    }
    function createFrame(object) {
        let frame = extend({}, object);
        frame._parent = object;
        return frame;
    }
    function blockParams(params, ids) {
        params.path = ids;
        return params;
    }
    function appendContextPath(contextPath, id) {
        return (contextPath ? contextPath + '.' : '') + id;
    }
    return {
        extend: extend,
        toString: toString,
        isFunction,
        isArray: isArray,
        indexOf: indexOf,
        escapeExpression: escapeExpression,
        isEmpty: isEmpty,
        createFrame: createFrame,
        blockParams: blockParams,
        appendContextPath: appendContextPath
    };
});