/*jshint loopfunc: true */
'use strict';

var Hoek         = require('hoek');
var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.postgres.queryBuilder;

module.exports = function(config) {
    var self        = this,
        stackHolder = {};

    helpers.getPluginFromStack(stackHolder);

    return new Promise(function(resolve) {
        var outputObjects = [],
            outputObject,
            pagination,
            dataSource,
            connection,
            querySoftRemove,
            querySelect,
            successUpdates,
            i,
            newData       = {
                status   : 'deleted',
                timestamp: {
                    deletedAt: new Date().toISOString()
                }
            };

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'softRemove');

        /* Parse data source into database and table */
        dataSource = helpers.postgres.parseDataSource(config.dataSource);
        connection = helpers.postgres.getConnection(self.options['write-store'], dataSource.database);

        /* Build select query */
        pagination = {
            offset: config.offset,
            limit : config.limit
        };
        helpers.keyEscape(config.sort);

        if (typeof config.native !== 'undefined') {
            querySelect = queryBuilder.native(dataSource.table, 'select', config.native, [], pagination, config.sort);
        } else {
            helpers.keyEscape(config.query);
            querySelect = queryBuilder.select(dataSource.table, config.query, [], pagination, config.sort);
        }

        connection.then(function callback(response) {
            response.client.query(querySelect, function callback(error, result) {
                var originalRow;
                var updatedRow;
                var columnIdentifier = {};

                if (error) {
                    throw new Error(error);
                }

                if (result.rows.length === 0) {
                    response.done();

                    return resolve([]);
                }

                successUpdates = 0;

                for (i = 0; i < result.rows.length; i++) {
                    originalRow = result.rows[i][helpers.constants.WS_DATA_FIELD];
                    updatedRow  = newData;

                    Hoek.merge(updatedRow, originalRow);
                    updatedRow  = helpers.postgres.dataWrapper(updatedRow);

                    columnIdentifier[helpers.constants.WS_DATA_FIELD + '->>\'' + helpers.constants.WS_IDENTIFIER + '\''] = result.rows[i][helpers.constants.WS_DATA_FIELD][helpers.constants.WS_IDENTIFIER].toString();

                    querySoftRemove = queryBuilder.update(dataSource.table, columnIdentifier, updatedRow);

                    /* Display query for debugging purpose */
                    if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
                        console.log(querySoftRemove + '\n');
                    }

                    response.client.query(querySoftRemove, function callback(errorSoftRemove, resultSoftRemove) {
                        if (errorSoftRemove) {
                            if (successUpdates === result.rows.length - 1) {
                                response.done();
                            }
                            throw new Error(errorSoftRemove);
                        }

                        outputObject = helpers.postgres.dataUnwrapper(resultSoftRemove.rows[0]);

                        /* Convert output objects */
                        if (config.outputMapping instanceof Function) {
                            outputObject = config.outputMapping(outputObject);
                        }
                        /* Validate output object */
                        if (config.outputSchema instanceof Object) {
                            outputObject = helpers.validateObject(config.outputSchema, outputObject);
                        }

                        outputObjects[successUpdates] = outputObject;

                        if (successUpdates === result.rows.length - 1) {
                            response.done();

                            return resolve(outputObjects);
                        }

                        successUpdates++;
                    });
                }
            });
        });
    });
};
