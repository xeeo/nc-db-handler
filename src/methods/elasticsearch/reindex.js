'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.elasticsearch.queryBuilder;

module.exports = function(config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var connection,
            dataSource,
            esQuery,
            action;

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'reindex');

        /* Add createdAt and updatedAt fields if not present */
        if (typeof config.payload.timestamp === 'undefined') {
            config.payload.timestamp = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        } else {
            if (typeof config.payload.timestamp.createdAt === 'undefined') {
                config.payload.timestamp.createdAt = new Date().toISOString();
            }

            if (typeof config.payload.timestamp.updatedAt === 'undefined') {
                config.payload.timestamp.updatedAt = new Date().toISOString();
            }
        }

        /* Validate payload */
        if (config.payloadSchema instanceof Object) {
            config.payload = helpers.validateObject(config.payloadSchema, config.payload);
        }
        /* Convert payload into elasticsearch mapped object */
        if (config.mapping instanceof Function) {
            config.payload = config.mapping(config.payload);
        }

        /* Parse data source into database and table */
        dataSource = helpers.elasticsearch.parseDataSource(config.dataSource);
        connection = helpers.elasticsearch.getConnection(self.options['read-store'], dataSource.index);

        action  = (config.replaceData === true) ? 'index' : 'update';
        esQuery = queryBuilder.bulk(action, dataSource.index, dataSource.type, config.query.id, config.payload, esQuery, config.refresh);

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
