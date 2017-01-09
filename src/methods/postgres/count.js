'use strict';

var Promise      = require('bluebird');
var helpers      = require('../../helpers');
var queryBuilder = helpers.postgres.queryBuilder;

module.exports = function(config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var fields = ['COUNT(*)'];
        var connection;
        var dataSource;
        var query;

        /* Validate config sent to update method */
        config = helpers.validateConfig(config, 'count');

        /* Parse data source into database and table */
        dataSource = helpers.postgres.parseDataSource(config.dataSource);
        connection = helpers.postgres.getConnection(self.options['write-store'], dataSource.database);

        /* Build query */
        if (typeof config.native !== 'undefined') {
            query = queryBuilder.native(dataSource.table, 'select', config.native, fields);
        } else {
            helpers.keyEscape(config.query);

            query = queryBuilder.select(dataSource.table, config.query, fields);
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

                return resolve(parseInt(result.rows[0].count));
            });
        });
    });
};
