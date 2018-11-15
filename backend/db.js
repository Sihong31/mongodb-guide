const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const mongodbUrl = 'mongodb+srv://sihong:admin@cluster0-4uoj9.mongodb.net/shop';

let _db;

const initDb = callback => {
    if (_db) {
        console.log('Database is already initialized');
        return callback(null, _db);
    }
    MongoClient.connect(mongodbUrl)
        .then(client => {
            _db = client;
            callback(null, _db);
        })
        .catch(err => {
            callback(err);
        });
}

const getDb = () => {
    if (!_db) {
        throw Error('Database not initialized');
    }
    return _db;
}

module.exports = {
    initDb,
    getDb
}