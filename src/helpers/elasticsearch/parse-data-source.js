'use strict';

module.exports = function(dataSource) {
    var dataSourceArray = dataSource.split('.');

    /* Validate if the are two fields [database, table] */
    if (dataSourceArray.length !== 2) {
        throw new Error('Unable to parse dataSource param');
    }

    dataSource = {
        index: dataSourceArray[0],
        type : dataSourceArray[1]
    };

    return dataSource;
};