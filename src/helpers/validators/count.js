'use strict';

var Joi             = require('joi');
var removeUndefined = require('../remove-undefined');

exports.getAddonSchema = function(options) {
    var schema = {};

    schema.native = (options.native && Joi.string().required());
    schema.query  = (!options.native && Joi.alternatives().try(Joi.array(), Joi.object()).required());

    return removeUndefined(schema);
};
