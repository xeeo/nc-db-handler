# nc-db-handler

The DS-Handler is the Module that handles the handling of the Data Store connections (PG and Elastic).

## Installation
```
npm install --save nc-db-handler
```

## Usage

```javascript
var NcDbHandler = require('nc-db-handler');
var dsHandler   = new NcDbHandler();
var config      = {
    'write-store': {
        db1: 'postgres://postgres:postgres@localhost/db1',
        db2: 'postgres://postgres:postgres@localhost/db1'
    },
    'read-store': {
        index1: 'https://user:pass@localhost',
        index2: 'https://user:pass@localhost'
    }
};

dsHandler.config(pgConfig);

dsHandler.create({...}).then({...});
```

## Method Summary

##### Write-Store Methods (PG)
- [Create](#create)
- [Read](#read)
- [Remove](#remove)
- [SoftRemove](#softremove)
- [Update](#update)
- [Count](#count)
- [PG](#pg)

##### Read-Store Methods (Elastic)
- [Search](#search)
- [Index](#index)
- [ReIndex](#reindex)
- [UnIndex](#unindex)
- [ES](#es)

## Write-Store Methods

#### Create

This methods hits PG

```javascript
ncDbHandler.create({
    dataSource: 'reviews.reviews', /* {String} | required | format: "database.table" */
    logQuery: true, /* {Boolean} | optional | default: false */
    mapping: require('adding-review-mapping'), /* {Function} | optional */
    payload: { /* {Object} | required */
        text: 'Ola',
        rating: '1',
        reviewerId: '123',
        profileId: '20',
        product: 'TK',
        platform: 'web',
        ip: '127.0.0.1',
        weddingDate: '21.01.2015'
    }
    outputMapping: require('some-mapper'), /* {Function} | optional */
    payloadSchema: {  /* {Object} | optional | Joi validation schema applied on payload */
        text: Joi.....
    },
    outputSchema: { /* {Object} | optional | Joi validation schema applied on the result of the outputMapping */
        text: Joi.....
    }
}).then(function success(result) {
   /**
    * @return {Object} - the Object will be the returned value of outputMapping and validated by the outputSchema
    */
});
```

[back to Method Summary](#nc-db-handler)

#### Read

This methods hits PG

```javascript
ncDbHandler.read({
    dataSource: 'reviews.reviews', /* {String} | required | format: "database.table" */
    logQuery: true, /* {Boolean} | optional | default: false */
    native: 'WHERE data->>\'id\' IN (\'13\', \'123\', \'1234\') LIMIT 2 ORDER BY data->>\'id\' DESC', /* {String} | optional */
    query:
        and: [
            { /* {Array|Object} | optional */
                {
                    native: 'data->\'id\' IN (\'13\', \'123\', \'1234\')'
                },
                {
                    or : [
                        {
                            'data->address->>street': 'Anderson'
                        },
                        {
                            always: 1
                        }
                    ]
                },
                {
                    email : [
                        'joe.doe@gmail.com',
                        'jane.doe@gmail.com',
                    ]
                }
            } /* WHERE data->'id' IN (13,123,1234) AND (data->'address'->>'street' = 'Anderson' OR data->>'always' = 1) AND (data->>'email' = 'joe.doe@gmail.com' OR data->>'email' = 'jane.doe@gmail.com') */
        ],
    sort: { /* {Object} | optional */
        'data->address->>street': 'asc'
    },
    limit: 1, /* {Number} | optional */
    offset: 20, /* {Number} | optional */
    outputMapping: require('some-mapper'), /* {Function} | optional */
    outputSchema: { /* {Object} | optional | Joi validation schema applied on the result of the outputMapping */
        address: Joi.....
    }
}).then(function success(results) {
    /**
     * @return {Array} - results is an Array of Objects mapped with outputMapping and validated using the outputSchema and matching the search criteria
     */
});

/* Other query examples
query: {
    or : {
        { 'native': 'id IN (13,123,1234)' },
        { and : {
            { 'meta->address->>street': 'Anderson"' },
            { 'meta->>always': 1 }
        } },
        { 'meta->>email' : [
            'joe.doe@gmail.com',
            'jane.doe@gmail.com',
        ] }
    }
} === WHERE id IN (13,123,1234) OR (meta->address->>street = "Anderson" AND meta->>always = 1) OR (meta->>email = "joe.doe@gmail.com" OR meta->>email = "jane.doe@gmail.com")
*/

/*
query: [
    { 'meta->>reviewer': 123 },
    { 'meta->>profile': 45 }
] === WHERE meta->>reviewer = 123 AND meta->>profile = 45
*/

```

[back to Method Summary](#nc-db-handler)

#### Remove

This methods hits PG

```javascript
ncDbHandler.remove({
    dataSource: 'reviews.reviews', /* {String} | required | format: "database.table" */
    logQuery: true, /* {Boolean} | optional | default: false */
    native: 'WHERE data->>\'id\' IN (\'1\', \'2\', \'3\')', /* {String} | optional */
    query: [ /* {Array|Object} | optional */
        {
            'data->>id': ['1', '2', '3']
        }
    ],
    sort: { /* {Object} | optional */
        'data->address->>street': 'asc'
    },
    limit: 1, /* {Number} | optional */
    offset: 20, /* {Number} | optional */
}).then(function success(results) {
    /**
     * @return {Array} - results is an Array of Objects containing the deleted Documents
     */
});
```

[back to Method Summary](#nc-db-handler)

#### SoftRemove

This methods hits PG

```javascript
ncDbHandler.softRemove({
    dataSource: 'reviews.reviews', /* {String} | required | format: "database.table" */
    logQuery: true, /* {Boolean} | optional | default: false */
    native: 'WHERE data->>\'id\' = \'UUID\'' /* {String} | optional */
    query: { /* {Array|Object} | optional */
        'data->>id' : 'UUID'
    },
    sort: { /* {Object} | optional */
        'data->address->>street': 'asc'
    },
    limit: 1, /* {Number} | optional */
    offset: 20, /* {Number} | optional */
}).then(function success(result) {
    /**
     * @return {Array} - results is an Array of Objects containing the updated Documents with {status: 'deleted', deletedAt: Date.now()}
     */
});
```

[back to Method Summary](#nc-db-handler)

#### Update

This methods hits PG

```javascript
ncDbHandler.update({
    dataSource: 'reviews.reviews', /* {String} | required | format: "database.table" */
    logQuery: true, /* {Boolean} | optional | default: false */
    native: 'WHERE data->>\'id\' = \'UUID\'' /* {String} | optional */
    query: { /* {Array|Object} | optional */
        'data->>id' : 'UUID'
    },
    payload: { /* {Object} | required */
       profiles: [555]
    },
    replaceData: false, /* {Boolean} | optional | defaults: false */
    mapping: require('mapping-function'), /* {Function} | optional */
    outputMapping: require('mapping-function') /* {Function} | optional */
    payloadSchema: {  /* {Object} | optional | Joi validation schema applied on the payload object */
       profiles: Joi.....
    },
    outputSchema: { /* {Object} | optional | Joi validation schema applied on the result of the outputMapping */
       profiles: Joi.....
    }
}).then(function success(results) {
    /**
     * @return {Array} - results is an Array of Objects representing all updated rows mapped with outputMapping and validated with outputSchema
     */
});
```

[back to Method Summary](#nc-db-handler)

#### Count

This methods hits PG

```javascript
ncDbHandler.count({
    dataSource: 'reviews.reviews', /* {String} | required | format: "database.table" */
    logQuery: true, /* {Boolean} | optional | default: false */
    native: 'WHERE data->>\'id\' = \'UUID\'' /* {String} | optional */
    query: { /* {Array|Object} | optional */
        'data->>id' : 'UUID'
    },
}).then(function success(result) {
    /**
     * @return {Number} - result is the COUNT
     */
});
```

[back to Method Summary](#nc-db-handler)

#### PG

This methods hits PG

```javascript
ncDbHandler.pg('db-reviews', 'SELECT * FROM reviews WHERE meta->>\'id\' = \'245342\'')
    .then(function success(result) {
        /**
         * @return {Object|Array} - result is the raw Postgres data
         */
    });
```

[back to Method Summary](#nc-db-handler)

## Read-Store Methods


#### Search

This methods hits Elastic

```javascript
ncDbHandler.search({
    dataSource: 'reviews.reviews', /* {String} | required | format: "index.type" */
    logQuery: true, /* {Boolean} | optional | default: false */
    query: {}, /* {Object} | optional | native Elastic QUERY object from body */
    filter: {}, /* {Object} | optional | native Elastic FILTER object from body */
    aggs: {}, /* {Object} | optional | native Elastic AGGREGATION object from body */
    /* even though the previous 3 are optional, at least one needs to be set */
    sort: { /* {Object} | optional */
        'address.street': 'asc'
    },
    limit: 1, /* {Number} | optional */
    offset: 20, /* {Number} | optional */
    outputMapping: require('some-mapper'), /* {Function} | optional */
    outputSchema: {  /* {Object} | optional | Joi validation schema applied on the result of the outputMapping */
       Joi.....
   }
}).then(function success(result) {
    /**
     * @return {Array} results is an Array of objects from ElasticSearch
     */
});
```

[back to Method Summary](#nc-db-handler)

#### Index

This methods hits Elastic

```javascript
ncDbHandler.index({
    dataSource: 'reviews.reviews', /* {String} | required | format: "index.type" */
    logQuery: true, /* {Boolean} | optional | default: false */
    payload: [ /* {Object|Array} | required */
       {
            id: 'UUID', /* required */
            user: 'some user name',
            content: 'some content here'
       },
       {
            id: 'UUID', /* required */
            user: 'another user',
            content: 'some content here'
       }
    ],
    mapping: require('some-mapper'), /* {Function} | optional */
    payloadSchema: {  /* {Object} | optional | Joi validation schema applied on the result of the mapping */
       id: Joi.....
    },
    replaceData: false /* {Boolean} | optional | defaults: false */
}).then(function success(result) {
    /**
     * @return {Boolean} - result is true if documents were indexed succesfully
     */
}).catch(function error(result) {
    /* Handle error here */
});
```

[back to Method Summary](#nc-db-handler)

#### ReIndex

This methods hits Elastic

```javascript
ncDbHandler.reindex({
    dataSource: 'reviews.reviews', /* {String} | required | format: "index.type" */
    logQuery: true, /* {Boolean} | optional | default: false */
    query: { /* {Object} | required */
       'id' : 'UUID' /* this is the only accepted format for updating */
    },
    payload: { /* {Array} | required */
       tags: ['red']
    },
    payloadSchema: { /* {Object} | optional | Joi validation schema applied on the result of the mapping */
       tags: Joi.....
    },
    replaceData: false /* {Boolean} | optional | defaults: false */
}).then(function success(result) {
    /**
     * {Boolean} - result is true if documents were updated succesfully
     */
});
```

[back to Method Summary](#nc-db-handler)

#### UnIndex

This methods hits Elastic

```javascript
ncDbHandler.unindex({
    dataSource: 'reviews.reviews' /* {String} | required */
    logQuery : true, /* {Boolean} | optional | default: false */
    query: { /* {Object} | optional | at least one between query and payload is mandatory */
        {
          term: {
            status: 'normal'
          }
        }
    },
    payload: ['UUID1', 'UUID2', 'UUID3'] /* {Array} | optional | an array of ES document ids */
}).then(function(response) {
    /**
     * {Boolean} - result is true if documents were removed succesfully
     */
}).catch(function(error) {
    // Handle errors throwns by method
});
```

[back to Method Summary](#nc-db-handler)

#### ES

This methods hits Elastic

```javascript
ncDbHandler.es(
    'reviews', /* {String} connectionName - the key of connection string used in config['read-store'] */
    'index', /* {String} action - elastic search action ('bulk', 'index', 'count', 'create', 'delete', 'deleteByQuery', 'get', 'search', 'update') */
    { /* {Object} query - raw elastic search query to be sent */
        index: 'reviews',
        type : 'review',
        id   : 'UUID',
        body : {
            tags: ["red"],
            user: 'Fred Jacobs'
        }
    }).then(function(response) {
    /**
     * @return {Object} - raw response from elastic search
     */
}).catch(function(error) {
    // Handle errors throws by method
});
```

[back to Method Summary](#nc-db-handler)

# Development
On your machine, we can initialize some data store dependencies to facilitate integration test.

## Mocha Integration Test
Creates a docker compose environment with Elasticsearch and Postgres with a container testing code in watch mode.
```Text
make run
```

## Install Packages
Removes node_modules folder and reinstalls from shrinkwrap or package.json
```Text
make install
```

## Create New Shrinkwrap From Scratch
Removes node_modules folder and npm_shrinkwrap.json and recreates from package.json using the latest from npm.
```Text
make clean
```

## Test with Mocha
Initiate mocha in watch mode on your local machine.  This will not boot up any docker resources so your integration test will fail.  But if you have postgres and elasticsearch containers running and hosted correctly, then these test will work.
```Text
make test
```

# Maintenance

### Docker Build
Docker image build process for containerizing code and test.
```Text
make docker-build
```

[back to top](#nc-db-handler)
