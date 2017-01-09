'use strict';

var constants = require('../constants');

module.exports = function(inputData) {
    var outputData = {};

    outputData[constants.WS_DATA_FIELD] = inputData;

    return outputData;
};