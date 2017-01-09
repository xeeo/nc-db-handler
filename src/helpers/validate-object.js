'use strict';

var Joi = require('joi');

/**
 * Validate an objects against the sent Joi scheme.
 *
 * @param {Object} schema - Joi validation keys or validation object
 * @param {Object} input - Object to be validated against the scheme
 *
 * @returns {Object}
 */
module.exports = function(schema, input) {
    var result;

    if ((typeof schema.isJoi === 'undefined') && (typeof schema._type === 'undefined' || schema._type !== 'object')) {
        schema = Joi.object().keys(schema);
    }

    result = Joi.validate(input, schema);

    if (result.error) {
        throw result.error;
    } else {
        return result.value;
    }
};
