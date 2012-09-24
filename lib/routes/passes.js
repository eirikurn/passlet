var model = require('../model');

/*
 * GET latest version of pass.
 */

exports.getLatestVersion = function(req, res, next){
  var query = {
    serial: req.params.serialNumber,
    passType: req.params.passTypeIdentifier
  };
  console.log(query);
  model.Pass.findOne(query, function(err, pass) {
    console.log(err, pass);
    if (!pass) {
      res.send(404);
    } else { 
      res.send(pass);
    }
  });
};