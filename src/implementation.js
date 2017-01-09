'use strict';

var singleton = require('nc-singleton');
var Hoek      = require('hoek');

var defaultOptions = {
    'read-store' : {},
    'write-store': {}
};

var Plugin = function Plugin() {
    this.options = defaultOptions;

    return singleton.call(this, Plugin);
};

Hoek.merge(Plugin.prototype, {
    config    : require('./methods/config'),
    count     : require('./methods/postgres/count'),
    create    : require('./methods/postgres/create'),
    pg        : require('./methods/postgres/pg'),
    read      : require('./methods/postgres/read'),
    remove    : require('./methods/postgres/remove'),
    softRemove: require('./methods/postgres/softRemove'),
    update    : require('./methods/postgres/update'),
    search    : require('./methods/elasticsearch/search'),
    index     : require('./methods/elasticsearch/index'),
    reindex   : require('./methods/elasticsearch/reindex'),
    unindex   : require('./methods/elasticsearch/unindex'),
    es        : require('./methods/elasticsearch/es')
});

/**
 * Export the Instance to the World
 */
module.exports = Plugin.bind({});
