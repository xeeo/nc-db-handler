'use strict';

module.exports = function(object) {
    for (var key in object) {
        if (object.hasOwnProperty(key) === true) {
            if (typeof object[key] === 'undefined') {
                delete object[key];
            }
        }
    }

    return object;
};
