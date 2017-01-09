'use strict';

var Joi = require('joi');

exports.getAddonSchema = function() {
    var schema = {};

    schema.payload       = Joi.alternatives().try(Joi.array(), Joi.object()).required();
    schema.mapping       = Joi.func().optional();
    schema.replaceData   = Joi.boolean().optional().default(false);
    schema.payloadSchema = Joi.object().optional();

    return schema;
};
