'use strict';

var Joi = require('joi');

exports.getAddonSchema = function(options) {
    var schema = {};

    if (typeof options.query !== 'undefined') {
        schema.query = Joi.object().required();
    } else {
        schema.payload = Joi.array().optional();
    }

    return schema;
};
