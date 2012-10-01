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
};

exports.getProviders = function() {
  return Object.keys(providers).map(function(k) { return providers[k]; });
};

/**
 * Loads a specific provider. Requires its module and adds
 * all its files to it.
 */
var loadProvider = function(providerName) {
  var provider
    , filesPath = path.join(__dirname, providerName, 'files')
    , files = []
    , i
    , length
    , file;

  // Load provider main module.
  try {
    provider = providers[providerName] = require('./' + providerName)
  } catch(e) {
    throw new Error("Could not find index.js for " + providerName + " provider.");
  }

  provider.name = providerName;
  provider.files = provider.files || {};

  // Load its scraper code.
  try {
    provider.scraper = fs.readFileSync(path.join(__dirname, providerName, 'scraper.js'), 'utf8');
  } catch(e) {
    if (e.code === "ENOENT")
      throw new Error("Could not find scraper.js for " + providerName + " provider.");
    throw e;
  }

  // Optionally load all the files in its files folder.
  try {
    files = fs.readdirSync(filesPath);
  } catch(e) { }
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
});