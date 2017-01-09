/*jshint loopfunc: true */
'use strict';

var Promise      = require('bluebird');
var Hoek         = require('hoek');
var helpers      = require('../../helpers');
var queryBuilder = helpers.postgres.queryBuilder;

module.exports = function(config) {
    var self        = this,
        stackHolder = {};

    helpers.getPluginFromStack(stackHolder);

    return new Promise(function callback(resolve, reject) {
        var inputDocument,
            pagination,
            dataSource,
            connection,
            querySelect;

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'update');

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

        /* Wrap payload data to match the table fields */
        inputDocument  = config.payload;
        config.payload = helpers.postgres.dataWrapper(config.payload);

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

        /* Display query for debugging purpose */
        if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
            console.log(querySelect + '\n');
        }

        connection.then(function callback(response) {
            response.client.query(querySelect, function callback(error, result) {
                var queryUpdate,
                    initialData,
                    finalData,
                    outputObjects    = [],
                    finalDocument    = {},
                    columnIdentifier = {},
                    i                = 0,
                    j                = 0;

                if (error) {
                    throw new Error(error);
                }

                if (result.rows.length === 0) {
                    response.done();

                    return resolve(outputObjects);
                }

                for (i = 0; i < result.rows.length; i++) {
                    initialData = result.rows[i][helpers.constants.WS_DATA_FIELD];
                    finalData   = config.payload[helpers.constants.WS_DATA_FIELD];

                    if (config.replaceData) {
                        finalDocument[helpers.constants.WS_DATA_FIELD] = finalData;
                    } else {
                        Hoek.merge(initialData, finalData, false, false);
                        finalDocument[helpers.constants.WS_DATA_FIELD] = initialData;
                    }

                    /* Add createdAt and updatedAt fields if not present */
                    if (typeof finalDocument[helpers.constants.WS_DATA_FIELD].timestamp === 'undefined') {
                        finalDocument[helpers.constants.WS_DATA_FIELD].timestamp = {
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                    } else {
                        if (typeof finalDocument[helpers.constants.WS_DATA_FIELD].timestamp.createdAt === 'undefined') {
                            finalDocument[helpers.constants.WS_DATA_FIELD].timestamp.createdAt = new Date().toISOString();
                        }

                        if (typeof finalDocument[helpers.constants.WS_DATA_FIELD].timestamp.updatedAt === 'undefined') {
                            finalDocument[helpers.constants.WS_DATA_FIELD].timestamp.updatedAt = new Date().toISOString();
                        }
                    }

                    /* Build update query */
                    columnIdentifier[helpers.constants.WS_DATA_FIELD + '->>\'' + helpers.constants.WS_IDENTIFIER + '\''] = finalDocument[helpers.constants.WS_DATA_FIELD][helpers.constants.WS_IDENTIFIER].toString();
                    queryUpdate                                                                                          = queryBuilder.update(dataSource.table, columnIdentifier, finalDocument);

                    /* Display query for debugging purpose */
                    if (process.env.DEBUG_HANDLER_QUERIES === true || config.logQuery === true) {
                        console.log(queryUpdate + '\n');
                    }

                    response.client.query(queryUpdate, function callback(errorUpdate, resultUpdate) {
                        var outputObject;

                        if (errorUpdate) {
                            return reject(errorUpdate);
                        }

                        outputObject = helpers.postgres.dataUnwrapper(resultUpdate.rows[0]);

                        /* Convert output objects */
                        if (config.outputMapping instanceof Function) {
                            outputObject = config.outputMapping(outputObject);
                        }
                        /* Validate output object */
                        if (config.outputSchema instanceof Object) {
                            outputObject = helpers.validateObject(config.outputSchema, outputObject);
                        }

                        outputObjects[j] = outputObject;
                        j++;

                        if (j === result.rows.length) {
                            response.done();

                            return resolve(outputObjects);
                        }
                    });
                }
            });
        });
    });
};
