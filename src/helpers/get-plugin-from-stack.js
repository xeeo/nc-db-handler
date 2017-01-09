'use strict';

module.exports = function(storage) {
    Error.stackTraceLimit = 25;

    Error.captureStackTrace(storage);

    storage.stack.split('\n').forEach(function(line) {
        var matches = line.match(/hapi\-[a-zA-Z\-]*/);

        storage.pluginName = (matches && matches.length && matches[0]) || storage.pluginName;
    });
};