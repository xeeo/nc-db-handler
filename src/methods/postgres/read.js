'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.postgres.queryBuilder;

module.exports = function(config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var fields        = {};
        var outputObjects = [];
        var outputObject;
        var pagination;
        var dataSource;
        var connection;
        var query;
        var i;

        /* Validate config */
        config = helpers.validateConfig(config, 'read');

        /* Parse data source into database and table */
        dataSource = helpers.postgres.parseDataSource(config.dataSource);
        connection = helpers.postgres.getConnection(self.options['write-store'], dataSource.database);

        /* Generate postgres query */
        pagination = {
            limit : config.limit,
            offset: config.offset
        };
        helpers.keyEscape(config.sort);

        if (typeof config.native !== 'undefined') {
            query = queryBuilder.native(dataSource.table, 'select', config.native, fields, pagination, config.sort);
        } else {
            helpers.keyEscape(config.query);
            query = queryBuilder.select(dataSource.table, config.query, fields, pagination, config.sort);
        }

        /* Display query for debugging purpose */
        if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
            console.log(query + '\n');
        }

        connection.then(function callback(response) {
            response.client.query(query, function callback(error, result) {
                response.done();

                if (error) {
                    return reject(error);
                }

                for (i = 0; i < result.rows.length; i++) {
                    outputObject = helpers.postgres.dataUnwrapper(result.rows[i]);

                    /* Convert output objects */
                    if (config.outputMapping instanceof Function) {
                        outputObject = config.outputMapping(outputObject);
                    }
                    /* Validate output object */
                    if (config.outputSchema instanceof Object) {
                        outputObject = helpers.validateObject(config.outputSchema, outputObject);
                    }
                    outputObjects[i] = outputObject;
                }

                return resolve(outputObjects);
            });
        });
    });
};
