'use strict';

var Promise = require('bluebird');
var helpers = require('../../helpers');

module.exports = function(database, nativeQuery) {
    var self = this;

    return new Promise(function(resolve, reject) {
        helpers.postgres.getConnection(self.options['write-store'], database)
            .then(function(connection) {
                connection.client.query(nativeQuery, function callback(error, result) {
                    connection.done();

                    if (error) {
                        return reject(new Error(error));
                    }

                    return resolve(result.rows);
                });
            })
            .catch(reject);
    });
};
