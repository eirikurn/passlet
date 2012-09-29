var providers = require('../providers');

/*
 * GET home page.
 */

exports.index = function(req, res) {
  var provs = providers.getProviders();
  provs = provs.map(function(p) { return p.name; });

  res.render('index', {
    providerNames: provs,
    errors: req.validationErrors(true)
  });
};

exports.createPasslet = function(req, res) {
  // Validate
  req.assert('email', 'Valid email required').notEmpty().isEmail();

  if (req.validationErrors()) {
    return exports.index(req, res);
  }

  res.send("SUCCESS " + req.param('email'))
};