var mongoose = require('mongoose');

var MONGO_DB = process.env.MONGO_DB || "mongodb://localhost/passes"

var db = mongoose.createConnection(MONGO_DB);

var schema = mongoose.Schema({
  passType: 'string',
  device: 'string',
  serial: 'string'
});
var Pass = exports.Pass = db.model('Pass', schema);