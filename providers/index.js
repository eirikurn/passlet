/**
 * Module dependencies
 */
var fs = require('fs')
  , path = require('path');

/**
 * A cache for providers.
 */
var providers = {};

/**
 * Returns a provider by name.
 */
exports.getProvider = function(name) {
  return providers[name];
}

/**
 * Loads a specific provider. Requires its module and adds
 * all its files to it.
 */
var loadProvider = function(providerName) {
  var provider = providers[providerName] = require('./' + providerName)
    , filesPath = path.join(__dirname, providerName, 'files')
    , files = fs.readdirSync(filesPath)
    , i
    , length
    , file;

  provider.files = provider.files || {};
  for (i=0, length=files.length; i < length; i++) {
    file = files[i];
    if (!(file in provider.files)) {
      provider.files[file] = fs.readFileSync(path.join(filesPath, file));
    }
  }
};

/**
 * Load all providers synchronously.
 */
fs.readdirSync(__dirname).forEach(function(f) {
  if (f !== "index.js") {
    loadProvider(f);
  }
})