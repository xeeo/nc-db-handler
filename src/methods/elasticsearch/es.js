'use strict';

var Promise = require('bluebird'),
    helpers = require('../../helpers');

module.exports = function(connectionName, action, query, config) {
    var self = this;

    return new Promise(function callback(resolve, reject) {
        var actions = [
            'bulk',
            'index',
            'count',
            'create',
            'delete',
            'deleteByQuery',
            'get',
            'search',
            'update'
        ];
        var connection;

        if (actions.indexOf(action) === -1) {
            throw new Error('Invalid action passed to es method');
        }

        /* Get elasticSearch connection */
        connection = helpers.elasticsearch.getConnection(self.options['read-store'], connectionName);

        /* Display query for debugging purpose */
        if (process.env.DEBUG_HANDLER_QUERIES === true || (config && config.logQuery === true)) {
            console.log(JSON.stringify(query));
        }

        connection[action](query)
            .then(function success(response) {
                resolve(response);
            })
            .catch(function error(err) {
                reject(err.toString());
            });
    });
};
