'use strict';

var uuid         = require('uuid');
var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.postgres.queryBuilder;

module.exports = function(config) {
    var self        = this,
        stackHolder = {};

    helpers.getPluginFromStack(stackHolder);

    return new Promise(function callback(resolve, reject) {
        var inputDocument;
        var outputDocument;
        var dataSource;
        var connection;
        var query;

        /* Validate config */
        config = helpers.validateConfig(config, 'create');

        /* Parse data source into database and table */
        dataSource = helpers.postgres.parseDataSource(config.dataSource);
        connection = helpers.postgres.getConnection(self.options['write-store'], dataSource.database);

        /* Validate payload */
        if (config.payloadSchema instanceof Object) {
            config.payload = helpers.validateObject(config.payloadSchema, config.payload);
        }

        /* Convert payload into database mapped object */
        if (config.mapping instanceof Function) {
            config.payload = config.mapping(config.payload);
        }

        /* Check if id is in payload, else generate one */
        if (typeof config.payload[helpers.constants.WS_IDENTIFIER] === 'undefined') {
            config.payload[helpers.constants.WS_IDENTIFIER] = uuid.v4();
        }

        /* Wrap payload data to match the table fields */
        inputDocument  = config.payload;

        /* Add createdAt and updatedAt fields if not present */
        if (typeof inputDocument.timestamp === 'undefined') {
            inputDocument.timestamp = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } else {
            if (typeof inputDocument.timestamp.createdAt === 'undefined') {
                inputDocument.timestamp.createdAt = new Date().toISOString();
            }

            if (typeof inputDocument.timestamp.updatedAt === 'undefined') {
                inputDocument.timestamp.updatedAt = new Date().toISOString();
            }
        }

        config.payload = helpers.postgres.dataWrapper(config.payload);

        /* Generate postgres query */
        query = queryBuilder.insert(dataSource.table, config.payload);

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

                outputDocument = helpers.postgres.dataUnwrapper(result.rows[0]);

                /* Convert output objects */
                if (config.outputMapping instanceof Function) {
                    outputDocument = config.outputMapping(outputDocument);
                }
                /* Validate output object */
                if (config.outputSchema instanceof Object) {
                    outputDocument = helpers.validateObject(config.outputSchema, outputDocument);
                }

                return resolve(outputDocument);
            });
        });
    });
};
