var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('invetory');

var service = {};

service.getById = getById;
service.searchByName = searchByName;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function getById(_id) {
    var deferred = Q.defer();

    db.inventory.findById(_id, function (err, productObject) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (productObject) {
            // return product
            deferred.resolve(_.omit(productObject, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(productObject) {
    var deferred = Q.defer();

    // validation
    db.inventory.findOne(
        { pid: productObject.pid },
        function (err, productObject) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (productObject) {
                // product id already exists
                deferred.reject('Product ID "' + productObject.pid + '" is already used');
            } else {
                createProduct();
            }
        });

    function createProduct() {
        // set user object to userParam without the cleartext password
        var product = productObject;

        db.inventory.insert(
            product,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, productObject) {
    var deferred = Q.defer();

    // validation
    db.inventory.findById(_id, function (err, productObject) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (product.pid !== productObject.pid) {
            // product id has changed so check if the new pid is already taken
            db.inventory.findOne(
                { pid: productObject.pid },
                function (err, productObject) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (productObject) {
                        // product already exists
                        deferred.reject('Product ID "' + req.body.pid + '" is already taken')
                    } else {
                        updateProduct();
                    }
                });
        } else {
            updateProduct();
        }
    });

    function updateProduct() {
        // fields to update
        var set = {
            name: productObject.name,
        };

        db.inventory.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.inventory.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}

function searchByName(name) {
    var deferred = Q.defer();

    db.inventory.findOne(
        { name: name },
        function (err, productList) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (productList) {
                deferred.resolve(_.omit(productObject, 'hash'));
            } else {
                deferred.reject('The search returned no results');
            }
        });

    return deferred.promise;
}