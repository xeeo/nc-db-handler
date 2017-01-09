'use strict';

var Promise  = require('bluebird');
var postgres = require('pg');

postgres.defaults.poolIdleTimeout    = 10;
postgres.defaults.reapIntervalMillis = 10;

module.exports = function(configs, database) {

    if (typeof configs[database] === 'undefined') {
        throw new Error('There is no configuration for database: ' + database);
    }

    return new Promise(function callback(resolve, reject) {
        /* Validate if there is a valid connection string for database */
        postgres.connect(configs[database], function callback(error, client, done) {
            var response;

            if (error) {
                reject(new Error(error));
            }

            response = {
                client: client,
                done  : done
            };

            resolve(response);
        });
    });
};
