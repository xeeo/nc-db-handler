'use strict';

/**
 * Current Instance
 *
 * @type {Object}
 */
var instance = {};

/**
 * Add Query - helper method to set query in ElasticSearch query object.
 *
 * @param {Object} queryObject - ElasticSearch query object
 * @param {Object} query - Object of queries to be applied
 *
 * @returns {Object} queryObject
 */
var addQuery = function addFields(queryObject, query) {
    if (typeof query !== 'undefined') {
        if (queryObject.body.query.filtered instanceof Object) {
            queryObject.body.query.filtered.query = query;
        } else {
            queryObject.body.query = query;
        }
    }

    return queryObject;
};

/**
 * Add Filters - helper method to set query filters for ElasticSearch query object.
 *
 * @param {Object} queryObject - ElasticSearch query object
 * @param {Object} filters - Native elasticSearch filter object
 *
 * @returns {Object} queryObject
 */
var addFilters = function addFilters(queryObject, filters) {
    var currentQuery;

    if (typeof filters !== 'undefined') {
        if (queryObject.body.query.filtered instanceof Object) {
            queryObject.body.query.filtered.filter = filters;
        } else {
            currentQuery           = queryObject.body.query;
            queryObject.body.query = {
                filtered: {
                    query : currentQuery,
                    filter: filters
                }
            };
        }
    }

    return queryObject;
};

/**
 * Add Limit - helper method to set the limit for ElasticSearch query object.
 *
 * @param {Object} queryObject - ElasticSearch query object
 * @param {Number} limit - Number of entries to be returned
 *
 * @returns {Object} queryObject
 */
var addLimit = function addLimit(queryObject, limit) {
    if (typeof limit !== 'undefined') {
        queryObject.body.size = parseInt(limit);
    }

    return queryObject;
};

/**
 * Add Offset - helper method to set the offset for ElasticSearch query object.
 *
 * @param {Object} queryObject - ElasticSearch query object
 * @param {Number} offset - Number of entries to be skipped
 *
 * @returns {Object} queryObject
 */
var addOffset = function addOffset(queryObject, offset) {
    if (typeof offset !== 'undefined') {
        queryObject.body.from = parseInt(offset);
    }

    return queryObject;
};

/**
 * Add Order - helper method to set query order for ElasticSearch query object.
 *
 * @param {Object} queryObject - ElasticSearch query object
 * @param {Object} sort - Native ElasticSearch sort object
 *
 * @returns {Object} queryObject
 */
var addSort = function addSort(queryObject, sort) {
    if (typeof sort !== 'undefined') {
        queryObject.body.sort = sort;
    }

    return queryObject;
};

/**
 * Add Aggregation - helper method to set aggregation for ElasticSearch query object.
 *
 * @param {Object} queryObject - ElasticSearch query object
 * @param {Object} aggregation - Native Elastic Search aggregation object
 *
 * @returns {Object}
 */
var addAggregations = function addAggregations(queryObject, aggregation) {
    if (typeof aggregation !== 'undefined') {
        queryObject.body.aggregations = aggregation;
    }

    return queryObject;
};

/**
 * Search method to create search object for ElasticSearch.
 *
 * @param {String} esIndex - ElasticSearch index
 * @param {String} esType - ElasticSearch type
 * @param {Object} query - Native query object for ElasticSearch
 * @param {Object} filters - Native filter object for ElasticSearch
 * @param {Object} aggregations - Native aggregation object for ElasticSearch
 * @param {Object} sort - Native sort object for ElasticSearch
 * @param {Number} limit - Number of entries to be returned
 * @param {Object} offset - Number of entries to be skipped
 *
 * @returns {String} query
 */
instance.search = function search(esIndex, esType, query, filters, aggregations, sort, limit, offset) {
    var response;

    response = {
        index: esIndex,
        type : esType,
        body : {
            query: {
                match_all: {}
            }
        }
    };

    addQuery(response, query);
    addFilters(response, filters);
    addAggregations(response, aggregations);
    addSort(response, sort);
    addLimit(response, limit);
    addOffset(response, offset);

    return response;
};

/**
 * Remove by query method to delete all elastic search documents found by query.
 *
 * @param {String} esIndex - ElasticSearch index
 * @param {String} esType - ElasticSearch type
 * @param {Object} esQuery - ElasticSearch query object
 *
 * @returns {Object}
 */
instance.removeByQuery = function removeByQuery(esIndex, esType, esQuery) {
    var query;

    query = {
        index: esIndex,
        type : esType,
        body : {
            query: esQuery
        }
    };

    return query;
};

/**
 * Bulk method to create an bulk array of queries for ElasticSearch.
 *
 * @param {String} action - action to take for the current document
 * @param {String} index - elastic search index
 * @param {String} type - elastic search type
 * @param {String} id - elastic search id
 * @param {Object} document - elastic search document
 * @param {Array} appendQuery - append to this query
 * @returns {Array}
 */
instance.bulk = function bulk(action, index, type, id, document, appendQuery, refresh) {
    var query = appendQuery || {
            body: []
        };
    var next  = {};

    if (refresh) {
        query.refresh = true;
    }

    next[action] = {
        _index: index,
        _type : type,
        _id   : id
    };
    query.body.push(next);

    if (action === 'index') {
        query.body.push(document);
    } else if (action === 'update') {
        query.body.push({
            doc: document
        });
    }

    return query;
};

/**
 * Export the Instance to the World
 */
module.exports = instance;
