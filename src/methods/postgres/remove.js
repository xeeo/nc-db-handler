'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.postgres.queryBuilder;

module.exports = function(config) {
    var self        = this,
        stackHolder = {};

    helpers.getPluginFromStack(stackHolder);

    return new Promise(function callback(resolve, reject) {
        var outputObjects = [];
        var outputObject;
        var pagination;
        var dataSource;
        var connection;
        var query;
        var i;

        /* Validate config */
        config = helpers.validateConfig(config, 'remove');

        /* Parse data source into database and table */
        dataSource = helpers.postgres.parseDataSource(config.dataSource);
        connection = helpers.postgres.getConnection(self.options['write-store'], dataSource.database);

        /* Generate postgres query */
        pagination = {
            offset: config.offset,
            limit : config.limit
        };
        helpers.keyEscape(config.sort);

        if (typeof config.native !== 'undefined') {
            query = queryBuilder.native(dataSource.table, 'delete', config.native, [], pagination, config.sort);
        } else {
            helpers.keyEscape(config.query);
            query = queryBuilder.remove(dataSource.table, config.query, pagination, config.sort);
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

                    /* Convert removed object */
                    if (config.outputMapping instanceof Function) {
                        outputObject = config.outputMapping(outputObject);
                    }
                    /* Validate removed object */
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
