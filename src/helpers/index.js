'use strict';

var fs = require('fs');

var loadHelpers = function loadHelpers(helpersPath) {
    var helperFiles = fs.readdirSync(helpersPath);
    var helperName;
    var helpers     = {};

    helperFiles.forEach(function callback(fileName) {
        helperName = fileName.replace(/\.[^\.]+$/, '').replace(/\-[a-z]/ig, function callback(match) {
            return match.replace('-', '').toUpperCase();
        });

        if (fs.lstatSync(helpersPath + '/' + fileName).isDirectory()) {
            helpers[helperName] = loadHelpers(helpersPath + '/' + fileName);
        } else {
            if (fileName !== 'index.js') {
                helpers[helperName] = require(helpersPath + '/' + fileName);
            }
        }
    });

    return helpers;
};

module.exports = loadHelpers(__dirname);
