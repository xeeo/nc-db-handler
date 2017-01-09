'use strict';

var squel = require('squel').useFlavour('postgres');

/**
 * Current Instance
 *
 * @type {Object}
 */
var instance = {};

/**
 * Build WHERE clause for Postgres based on the filters sent.
 *
 * @param {Array | Object} filters - query rules to be applied
 *
 * @returns {Object} queryObject
 */
var buildFilters = function buildFilters(filters) {
    var operator;
    var innerQuery;
    var query = squel.expr();

    if (typeof filters === 'object') {
        // jscs: disable
        Object.keys(filters).forEach(function callback(key) {
            if (key === 'and' && filters[key] instanceof Object) {
                query.and_begin();
                Object.keys(filters[key]).forEach(function callback(innerKey) {
                    innerQuery = buildFilters(filters[key][innerKey]);
                    query.and(innerQuery);
                });
                query.end();
            } else if (key === 'or' && filters[key] instanceof Object) {
                query.or_begin();
                Object.keys(filters[key]).forEach(function callback(innerKey) {
                    innerQuery = buildFilters(filters[key][innerKey]);
                    query.or(innerQuery);
                });
                query.end();
            } else if (key === 'native' && typeof filters[key] === 'string') {
                query.and(filters[key]).toString();
            } else if (filters[key].toString() === '[object Object]') {
                query.and_begin();
                Object.keys(filters[key]).forEach(function callback(innerKey) {
                    switch (innerKey) {
                        case 'gt':
                            query.and(key + ' ' + instance.operator.greater, filters[key][innerKey]);
                            break;
                        case 'gte':
                            query.and(key + ' ' + instance.operator.greaterOrEqual, filters[key][innerKey]);
                            break;
                        case 'lt':
                            query.and(key + ' ' + instance.operator.less, filters[key][innerKey]);
                            break;
                        case 'lte':
                            query.and(key + ' ' + instance.operator.lessOrEqual, filters[key][innerKey]);
                            break;
                        case 'not':
                            operator               = (filters[key][innerKey] instanceof Array) ? instance.operator.notIn : instance.operator.notEqual;
                            filters[key][innerKey] = (filters[key][innerKey].toString() === '[object Object]') ? JSON.stringify(filters[key][innerKey]) : filters[key][innerKey];
                            query.and(key + ' ' + operator, filters[key][innerKey]);
                            break;
                        case 'like':
                            query.and(key + ' ' + instance.operator.like, '%' + filters[key][innerKey] + '%');
                            break;
                        case 'nlike':
                            query.and(key + ' ' + instance.operator.notLike, '%' + filters[key][innerKey] + '%');
                            break;
                        case 'regexp':
                            query.and(key + ' ' + instance.operator.regexp, filters[key][innerKey]);
                            break;
                        case 'jc':
                            filters[key][innerKey] = (filters[key][innerKey].toString() === '[object Object]') ? JSON.stringify(filters[key][innerKey]) : filters[key][innerKey];
                            query.and(key + ' ' + instance.operator.jsonbContain, filters[key][innerKey]);
                            break;
                        case 'jic':
                            filters[key][innerKey] = (filters[key][innerKey].toString() === '[object Object]') ? JSON.stringify(filters[key][innerKey]) : filters[key][innerKey];
                            query.and(key + ' ' + instance.operator.jsonbIsContained, filters[key][innerKey]);
                            break;
                    }
                });
                query.end();
            } else {
                operator     = (filters[key] instanceof Array) ? instance.operator.in : instance.operator.equal;
                filters[key] = (filters[key].toString() === '[object Object]') ? JSON.stringify(filters[key]) : filters[key];

                query.and(key + ' ' + operator, filters[key]).toString();
            }
        });
        // jscs: enable
    }

    return query.toString();
};

/**
 * Add Filters helper method to set query filters for SquelJs query object.
 *
 * @param {Object} queryObject - SquelJs query object
 * @param {Array | Object} filters - Array of fields to be selected
 *
 * @returns {Object} queryObject
 */
var addFilters = function addFilters(queryObject, filters) {
    filters = buildFilters(filters);

    queryObject.where(filters);

    return queryObject;
};

/**
 * Add Fields helper method to set requested fields for SquelJs query object.
 *
 * @param {Object} queryObject - SquelJs query object
 * @param {Array} fields - Array of fields to be selected
 *
 * @returns {Object} queryObject
 */
var addFields = function addFields(queryObject, fields) {
    var i;
    var field;

    if (fields instanceof Array) {
        for (i = 0; i < fields.length; i++) {
            if (fields[i] instanceof Object) {
                field = Object.keys(fields[i])[0];
                queryObject.field(field, fields[i][field]);
            } else {
                queryObject.field(fields[i]);
            }
        }
    }

    return queryObject;
};

/**
 * Add Limit helper method to set the limit for SquelJs query object.
 *
 * @param {Object} queryObject - SquelJs query object
 * @param {Object} pagination - Pagination options like limit and offset
 *
 * @returns {Object} queryObject
 */
var addPagination = function addPagination(queryObject, pagination) {
    if (typeof pagination !== 'undefined') {
        if (typeof pagination.offset !== 'undefined') {
            queryObject.offset(pagination.offset);
        }

        if (typeof pagination.limit !== 'undefined') {
            queryObject.limit(pagination.limit);
        }
    }

    return queryObject;
};

/**
 * Add Order helper method to set query order for SquelJs query object.
 *
 * @param {Object} queryObject - SquelJs query object
 * @param {Object} order - Field and direction of sorting (asc: true|false) for returned entries
 *
 * @returns {Object} queryObject
 */
var addOrder = function addOrder(queryObject, order) {
    var direction;

    if (typeof order !== 'undefined') {
        Object.keys(order).forEach(function callback(key) {
            direction = (order[key] === 'asc');
            queryObject.order(key, direction);
        });
    }

    return queryObject;
};

/**
 *Config used for every query statement built
 *
 * @type {Object}
 */
var queryConfig = {
    replaceSingleQuotes: true
};

/**
 * Operator helper object
 *
 * @type {Object}
 */
instance.operator = {
    and             : 'AND',
    or              : 'OR',
    equal           : '= ?',
    notEqual        : '!= ?',
    less            : '< ?',
    lessOrEqual     : '<= ?',
    greater         : '> ?',
    greaterOrEqual  : '>= ?',
    like            : 'LIKE ?',
    notLike         : 'NOT LIKE ?',
    in              : 'IN ?',
    notIn           : 'NOT IN ?',
    regexp          : '~ ?',
    jsonbContain    : '@> ?',
    jsonbIsContained: '<@ ?'
};

/**
 * Insert method to create insert sql query.
 *
 * @param {String} table - Table name used for insert query
 * @param {Object} object - Object data to be inserted
 *
 * @returns {String} query
 */
instance.insert = function insert(table, object) {
    var query = squel.insert(queryConfig);

    query.into(table);
    query.returning('*');

    for (var key in object) {
        if (object.hasOwnProperty(key) === true) {
            if (typeof object[key] !== 'string') {
                object[key] = JSON.stringify(object[key]);
            }
            query.set(key, object[key]);
        }
    }

    return query.toString();
};

/**
 * Select method to create select sql query.
 *
 * @param {String} table - Table name used for select query
 * @param {Array | Object} filters - Filter object, array of filters or a filters group object
 * @param {Array} fields - Selected fields to be returned
 * @param {Object} pagination - Offset and Limit numbers to be returned
 * @param {Object} order - Field and direction of sorting for returned entries
 *
 * @returns {String} query
 */
instance.select = function select(table, filters, fields, pagination, order) {
    var query = squel.select(queryConfig);

    query.from(table);

    addFilters(query, filters);
    addFields(query, fields);
    addPagination(query, pagination);
    addOrder(query, order);

    return query.toString();
};

/**
 * Update method to create update Sql query.
 *
 * @param {String} table - Table name used for update query
 * @param {Array | Object} filters - Filter object, array of filters or a filters group object
 * @param {Object} fields - Selected fields to be updated
 * @param {Number} limit - Number of entries to be updated
 * @param {Object} order - Field and direction of sorting for updated entries
 *
 * @returns {String} query
 */
instance.update = function update(table, filters, fields, limit, order) {
    var query = squel.update(queryConfig);

    query.table(table);
    query.returning('*');

    Object.keys(fields).forEach(function callback(key) {
        if (typeof fields[key] !== 'string') {
            fields[key] = JSON.stringify(fields[key]);
        }
        query.set(key, fields[key]);
    });

    addFilters(query, filters);
    addPagination(query, limit);
    addOrder(query, order);

    return query.toString();
};

/**
 * Remove method to create delete Sql query.
 *
 * @param {String} table - Table name used for delete query
 * @param {Array | Object} filters - Filter object, array of filters or a filters group object
 * @param {Object} pagination - Pagination options like limit and offset
 * @param {Object} order - Field and direction of sorting for deleted entries
 *
 * @returns {String} query
 */
instance.remove = function remove(table, filters, pagination, order) {
    var query = squel.delete(queryConfig);

    query.from(table);
    query.returning('*');

    addFilters(query, filters);
    addPagination(query, pagination);
    addOrder(query, order);

    return query.toString();
};

/**
 * Build sql queries based on an action, table and some native query that will be appended.
 *
 * @param {String} table - Table name used for query
 * @param {String} action - SQL action used to build query
 * @param {String} appendQuery - Native SQL query appended to the rest of the query
 * @param {Object} fields - fields to be returned
 * @param {Object} pagination - Pagination options like limit and offset
 * @param {Object} order - Field and direction of sorting for deleted entries
 *
 * @returns {String}
 */
instance.native = function native(table, action, appendQuery, fields, pagination, order) {
    var query = squel[action](queryConfig);

    query.from(table);
    query.where(appendQuery);

    if (typeof query.returning !== 'undefined') {
        query.returning('*');
    }

    addFields(query, fields);
    addPagination(query, pagination);
    addOrder(query, order);

    return query.toString();
};

/**
 * Export the Instance to the World
 */
module.exports = instance;
