var mongoose = require('mongoose')
  , uuid = require('node-uuid')
  , crypto = require('crypto')

  , env = require('./env');

var schema
  , db = mongoose.createConnection(env.MONGO_DB);

// Passes
schema = mongoose.Schema({
  devices: [String],
  serial: String,
  authToken: String
});
exports.Pass = db.model('Pass', schema);

// Users
var createBookmarkletId = function() {
  var shasum = crypto.createHash('sha1');
  shasum.update(uuid.v4(), 'utf8');
  return shasum.digest('base64');
};

schema = mongoose.Schema({
  email: String,
  bookmarklet: { type: String, default: createBookmarkletId },
  sendPassesToEmail: { type: Boolean, default: true }
});
exports.User = db.model('User', schema);

// Login tokens
schema = mongoose.Schema({
  token: String,
  email: String
});
exports.LoginToken = db.model('LoginToken', schema);