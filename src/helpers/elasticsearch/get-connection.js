'use strict';

var elasticsearch = require('elasticsearch');

var clients = {};

module.exports = function(configs, index) {
    /* Validate if there is a valid connection string for index */
    if (typeof configs[index] === 'undefined') {
        throw new Error('There is no configuration for elasticsearch: ' + index);
    }

    if (!clients[index]) {
        clients[index] = new elasticsearch.Client({
            host: configs[index]
        });
    }

    return clients[index];
};