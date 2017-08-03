'use strict';

var keyEscape = function(key) {
    var escapedKey = key.replace(/(\->>)|(\->)|(#>>)|(#>)|(@>)|(<@)|(\?\|)|(\?&)|(\?(?!=\|))/g, '\'$1$2$3$4$5$6$7$8$9\'').replace(/'/, '');

    if (escapedKey.slice(-1) === ')') {
        escapedKey = escapedKey.substr(0, escapedKey.length - 1) + '\')';
    } else {
        escapedKey += '\'';
    }

    return escapedKey;
};

var checkKeys = function(object) {
    var restrictedKeys = [
        'native',
        'and',
        'or',
        'gt',
        'gte',
        'lt',
        'lte',
        'not',
        'like',
        'nlike',
        'regexp',
        'jc',
        'jic'
    ];

    for (var key in object) {
        if (object.hasOwnProperty(key) === true) {
            if (typeof object[key] === 'object') {
                if (key === 'jc') {
                    continue;
                }
                checkKeys(object[key]);
            }

            if ((restrictedKeys.indexOf(key) === -1) && isNaN(parseInt(key, 10))) {
                object[keyEscape(key)] = object[key];
                delete object[key];
            }
        }
    }
};

module.exports = checkKeys;
