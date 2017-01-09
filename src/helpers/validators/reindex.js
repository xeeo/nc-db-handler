'use strict';

var Joi = require('joi');

exports.getAddonSchema = function() {
    var schema = {};

    schema.query         = Joi.object().required();
    schema.payload       = Joi.object().required();
    schema.payloadSchema = Joi.object().optional();
    schema.mapping       = Joi.func().optional();
    schema.replaceData   = Joi.boolean().optional().default(false);

    return schema;
};
