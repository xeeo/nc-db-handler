'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.elasticsearch.queryBuilder;

module.exports = function(config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var queryResponse,
            connection,
            dataSource,
            esQuery = null;

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'unindex');

        /* Parse data source into database and table */
        dataSource = helpers.elasticsearch.parseDataSource(config.dataSource);
        connection = helpers.elasticsearch.getConnection(self.options['read-store'], dataSource.index);

        if (typeof config.query !== 'undefined') {
            esQuery       = queryBuilder.removeByQuery(dataSource.index, dataSource.type, config.query);
            queryResponse = connection.deleteByQuery(esQuery);
        } else if (typeof config.payload !== 'undefined') {
            config.payload.forEach(function callback(id) {
                esQuery = queryBuilder.bulk('delete', dataSource.index, dataSource.type, id, null, esQuery);
            });
            queryResponse = connection.bulk(esQuery);
        } else {
            throw new Error('There is no query or payload sent to unindex method');
        }

        /* Display query for debugging purpose */
        if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
            console.log(JSON.stringify(esQuery));
        }

        queryResponse.then(function() {
            return resolve(true);
        }).catch(function(error) {
            return reject(error);
        });
    });
};
