'use strict';

var Joi = require('joi');

exports.getAddonSchema = function() {
    var schema = {};

    schema.payload       = Joi.object().required();
    schema.mapping       = Joi.func().optional();
    schema.outputMapping = Joi.func().optional();
    schema.payloadSchema = Joi.object().optional();
    schema.outputSchema  = Joi.object().optional();

    return schema;
};
