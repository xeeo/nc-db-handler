'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.elasticsearch.queryBuilder;

module.exports = function(config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var currentPayload,
            connection,
            dataSource,
            esQuery,
            i;

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'index');

        /* Parse data source into database and table */
        dataSource = helpers.elasticsearch.parseDataSource(config.dataSource);
        connection = helpers.elasticsearch.getConnection(self.options['read-store'], dataSource.index);

        if (config.payload.toString() === '[object Object]' && typeof config.payload.push === 'undefined') {
            config.payload = [config.payload];
        }

        for (i = 0; i < config.payload.length; i++) {
            currentPayload = config.payload[i];

            /* Add createdAt and updatedAt fields if not present */
            if (typeof currentPayload.timestamp === 'undefined') {
                currentPayload.timestamp = {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            } else {
                if (typeof currentPayload.timestamp.createdAt === 'undefined') {
                    currentPayload.timestamp.createdAt = new Date().toISOString();
                }

                if (typeof currentPayload.timestamp.updatedAt === 'undefined') {
                    currentPayload.timestamp.updatedAt = new Date().toISOString();
                }
            }

            /* Validate payload */
            if (config.payloadSchema instanceof Object) {
                currentPayload = helpers.validateObject(config.payloadSchema, config.payload[i]);
            }
            /* Convert payload into database mapped object */
            if (config.mapping instanceof Function) {
                currentPayload = config.mapping(config.payload[i]);
            }

            if (typeof currentPayload.id === 'undefined') {
                throw new Error('There is no id in payload data for document number: ' + i);
            }

            esQuery = queryBuilder.bulk('index', dataSource.index, dataSource.type, currentPayload.id, currentPayload, esQuery, config.refresh);
        }

        /* Display query for debugging purpose */
        if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
            console.log(JSON.stringify(esQuery));
        }

        connection.bulk(esQuery)
            .then(function(response) {
                if (response.errors === true) {
                    return reject(new Error(JSON.stringify(response)));
                }

                return resolve(response);
            }).catch(function(error) {
                return reject(error);
            });
    });
};
