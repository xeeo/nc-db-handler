'use strict';

var Joi             = require('joi');
var removeUndefined = require('../remove-undefined');

exports.getAddonSchema = function(options) {
    var schema = {};

    schema.native        = (options.native && Joi.string().required());
    schema.query         = (!options.native && Joi.alternatives().try(Joi.array(), Joi.object()).required());
    schema.sort          = Joi.object().optional();
    schema.limit         = Joi.number().optional();
    schema.offset        = Joi.number().optional();
    schema.payload       = Joi.object().required();
    schema.mapping       = Joi.func().optional();
    schema.outputMapping = Joi.func().optional();
    schema.replaceData   = Joi.boolean().optional().default(false);
    schema.payloadSchema = Joi.object().optional();
    schema.outputSchema  = Joi.object().optional();

    return removeUndefined(schema);
};
