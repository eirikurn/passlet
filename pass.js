var zipstream = require('zipstream')
  , uuid = require('node-uuid')
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , providers = require('./providers')
  , model = require('./model');

/**
 * Constants
 */
var PASS_DIR = process.env.PASSLET_PASS_DIR || path.join(__dirname, 'passes');

var ORGANIZATION_NAME = process.env.PASSLET_ORGANIZATION_NAME;
var PASS_TYPE = process.env.PASSLET_PASS_TYPE;
var TEAM_IDENTIFIER = process.env.PASSLET_TEAM_IDENTIFIER;
var WEB_SERVICE = process.env.PASSLET_BASE_URL + '/passbook';

var STYLES = ['boardingPass', 'coupon', 'eventTicket', 'generic', 'storeCard'];

var FIELD_TYPES = ['headerFields', 'primaryFields', 'secondaryFields', 'auxiliaryFields', 'backFields'];

var zipFiles = function(zip, files, callback) {
  var currentFile = files[0];
  var inStream = fs.createReadStream(currentFile);
  zip.addFile(inStream, { name: path.basename(currentFile) }, function() {
    zipFiles(zip, files.slice(1), callback);
  });
};

var signPass = function(filename, files, callback) {
  var outPath = path.join(PASS_DIR, filename);
  var out = fs.createWriteStream(outPath);
  var zip = zipstream.createZip();
  zip.pipe(out);

  async.forEachSeries(Object.keys(files), function(f, cb) {
    zip.addFile(files[f], { name: f }, cb);
  }, function() {
    zip.finalize(function(written) {
      console.log("Created pass", outPath);
      callback();
    });
  });
};

var buildPass = function(provider, pass, passInfo) {
  var files = pass.files = pass.files || {}
    , fields = pass.fields || {}
    , subFields;

  for (f in provider.files) {
    if (!(f in files)) {
      files[f] = provider.files[f];
    }
  }

  passData = JSON.parse(files["pass.json"]);
  for (k in passData) {
    if (~STYLES.indexOf(k)) {
      for (j in passData[k]) {
        if (~FIELD_TYPES.indexOf(j)) {
          subFields = passData[k][j];
          subFields = subFields.map(function(f) { if (f.key in fields) { f.value = fields[f.key]; } return f; });
          subFields = subFields.filter(function(f) { return f.value != null; });
          passData[k][j] = subFields;
        }
      }
    }
  }

  passData.description = pass.description || passData.description;
  for (k in passInfo) {
    passData[k] = passInfo[k];
  }
  files["pass.json"] = JSON.stringify(passData, null, "  ");
  return pass;
};

/**
 * Creates a pass for the specific provider.
 */
exports.createPass = function(providerName, data, cb) {
  var serial = uuid.v4()
    , authToken = uuid.v4()
    , provider = providers.getProvider(providerName);

  passInfo = {
    formatVersion: 1,
    organizationName: ORGANIZATION_NAME,
    passTypeIdentifier: PASS_TYPE,
    serialNumber: serial,
    teamIdentifier: TEAM_IDENTIFIER,
    webServiceURL: WEB_SERVICE,
    authenticationToken: authToken
  };

  provider.createPass(data, function(err, pass) {
    pass = buildPass(provider, pass, passInfo);
    signPass(serial + ".zip", pass.files, function() {
      model.Pass({serial: serial, authToken: authToken}).save(function(err, pass) {
        cb(err, pass);
      });
    });
  });
};