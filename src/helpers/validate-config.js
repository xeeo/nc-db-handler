'use strict';

var Joi  = require('joi'),
    Hoek = require('hoek');

/**
 * Validate configuration object sent to each postgres method.
 *
 * @param {Object} options - Configuration object sent to each postgres method
 * @param {String} action - SQL method used
 *
 * @returns {Object}
 */
module.exports = function(options, action) {
    var result;

    var schema = {
        dataSource: Joi.string().required(),
        logQuery  : Joi.boolean().optional().default(false),
        refresh   : Joi.boolean().optional().default(false)
    };

    Hoek.merge(schema, require('./validators/' + action).getAddonSchema(options));

    schema = Joi.object().keys(schema);
    result = Joi.validate(options, schema);

    if (result.error) {
        throw result.error;
    } else {
        return result.value;
    }
};
