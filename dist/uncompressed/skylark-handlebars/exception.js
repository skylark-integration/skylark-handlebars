define(function () {
    'use strict';
    const errorProps = [
        'description',
        'fileName',
        'lineNumber',
        'endLineNumber',
        'message',
        'name',
        'number',
        'stack'
    ];
    function Exception(message, node) {
        let loc = node && node.loc, line, endLineNumber, column, endColumn;
        if (loc) {
            line = loc.start.line;
            endLineNumber = loc.end.line;
            column = loc.start.column;
            endColumn = loc.end.column;
            message += ' - ' + line + ':' + column;
        }
        let tmp = Error.prototype.constructor.call(this, message);
        for (let idx = 0; idx < errorProps.length; idx++) {
            this[errorProps[idx]] = tmp[errorProps[idx]];
        }
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Exception);
        }
        try {
            if (loc) {
                this.lineNumber = line;
                this.endLineNumber = endLineNumber;
                if (Object.defineProperty) {
                    Object.defineProperty(this, 'column', {
                        value: column,
                        enumerable: true
                    });
                    Object.defineProperty(this, 'endColumn', {
                        value: endColumn,
                        enumerable: true
                    });
                } else {
                    this.column = column;
                    this.endColumn = endColumn;
                }
            }
        } catch (nop) {
        }
    }
    Exception.prototype = new Error();
    return Exception;
});