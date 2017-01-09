'use strict';

var Joi = require('joi');

exports.getAddonSchema = function() {
    var schema = {};

    schema.query         = Joi.object().optional();
    schema.filter        = Joi.object().optional();
    schema.aggs          = Joi.object().optional();
    schema.sort          = Joi.object().optional();
    schema.limit         = Joi.number().optional();
    schema.offset        = Joi.number().optional();
    schema.outputMapping = Joi.func().optional();
    schema.outputSchema  = Joi.object().optional();

    return schema;
};
