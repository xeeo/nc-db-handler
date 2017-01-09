'use strict';

var Hoek    = require('hoek'),
    Promise = require('bluebird');

module.exports = function(options) {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.options = Hoek.applyToDefaults(self.options, options);

        return resolve();
    });
};