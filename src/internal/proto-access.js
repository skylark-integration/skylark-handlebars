define([
    './create-new-lookup-object',
    '../logger'
], function (a, logger) {
    'use strict';
    const loggedProperties = Object.create(null);
    function createProtoAccessControl(runtimeOptions) {
        let defaultMethodWhiteList = Object.create(null);
        defaultMethodWhiteList['constructor'] = false;
        defaultMethodWhiteList['__defineGetter__'] = false;
        defaultMethodWhiteList['__defineSetter__'] = false;
        defaultMethodWhiteList['__lookupGetter__'] = false;
        let defaultPropertyWhiteList = Object.create(null);
        defaultPropertyWhiteList['__proto__'] = false;
        return {
            properties: {
                whitelist: a.createNewLookupObject(defaultPropertyWhiteList, runtimeOptions.allowedProtoProperties),
                defaultValue: runtimeOptions.allowProtoPropertiesByDefault
            },
            methods: {
                whitelist: a.createNewLookupObject(defaultMethodWhiteList, runtimeOptions.allowedProtoMethods),
                defaultValue: runtimeOptions.allowProtoMethodsByDefault
            }
        };
    }
    function resultIsAllowed(result, protoAccessControl, propertyName) {
        if (typeof result === 'function') {
            return checkWhiteList(protoAccessControl.methods, propertyName);
        } else {
            return checkWhiteList(protoAccessControl.properties, propertyName);
        }
    }
    function checkWhiteList(protoAccessControlForType, propertyName) {
        if (protoAccessControlForType.whitelist[propertyName] !== undefined) {
            return protoAccessControlForType.whitelist[propertyName] === true;
        }
        if (protoAccessControlForType.defaultValue !== undefined) {
            return protoAccessControlForType.defaultValue;
        }
        logUnexpecedPropertyAccessOnce(propertyName);
        return false;
    }
    function logUnexpecedPropertyAccessOnce(propertyName) {
        if (loggedProperties[propertyName] !== true) {
            loggedProperties[propertyName] = true;
            logger.log('error', `Handlebars: Access has been denied to resolve the property "${ propertyName }" because it is not an "own property" of its parent.\n` + `You can add a runtime option to disable the check or this warning:\n` + `See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details`);
        }
    }
    function resetLoggedProperties() {
        Object.keys(loggedProperties).forEach(propertyName => {
            delete loggedProperties[propertyName];
        });
    }
    return {
        createProtoAccessControl: createProtoAccessControl,
        resultIsAllowed: resultIsAllowed,
        resetLoggedProperties: resetLoggedProperties
    };
});