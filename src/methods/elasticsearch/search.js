'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.elasticsearch.queryBuilder;

module.exports = function(config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var outputObject;
        var connection;
        var dataSource;
        var esQuery;
        var results;
        var i;

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'search');

        /* Parse data source into database and table */
        dataSource = helpers.elasticsearch.parseDataSource(config.dataSource);
        connection = helpers.elasticsearch.getConnection(self.options['read-store'], dataSource.index);

        /* Create elasticsearch query object */
        esQuery = queryBuilder.search(dataSource.index, dataSource.type, config.query, config.filter, config.aggs, config.sort, config.limit, config.offset);

        /* Display query for debugging purpose */
        if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
            console.log(JSON.stringify(esQuery));
        }

        connection.search(esQuery)
            .then(function callback(esResponse) {
                results = {
                    total: esResponse.hits.total,
                    hits : []
                };

                for (i = 0; i < esResponse.hits.hits.length; i++) {
                    outputObject = esResponse.hits.hits[i]._source;
                    outputObject.id = esResponse.hits.hits[i]._id;

                    /* Convert output objects */
                    if (config.outputMapping instanceof Function) {
                        outputObject = config.outputMapping(outputObject);
                    }
                    /* Validate output object */
                    if (config.outputSchema instanceof Object) {
                        outputObject = helpers.validateObject(config.outputSchema, outputObject);
                    }
                    results.hits[i] = outputObject;
                }

                if (typeof esResponse.aggregations !== 'undefined') {
                    results.aggregations = {};

                    Object.keys(esResponse.aggregations).forEach(function callback(aggName) {
                        results.aggregations[aggName] = esResponse.aggregations[aggName].buckets;
                    });
                }

                return resolve(results);
            }).catch(function callback(error) {
            return reject(error);
        });
    });
};
