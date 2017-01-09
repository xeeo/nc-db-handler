'use strict';

var constants = require('../constants');

module.exports = function(inputData) {
    return inputData[constants.WS_DATA_FIELD];
};
