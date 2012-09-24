var mongoose = require('mongoose');

var MONGO_DB = process.env.MONGO_DB || "mongodb://localhost/passes"

var db = mongoose.createConnection(MONGO_DB);

var schema = mongoose.Schema({
  devices: [String],
  serial: String,
  authToken: String
});
var Pass = exports.Pass = db.model('Pass', schema);