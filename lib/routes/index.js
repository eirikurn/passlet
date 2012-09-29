var providers = require('../providers');

/*
 * GET home page.
 */

exports.index = function(req, res){
  var provs = providers.getProviders();
  provs = provs.map(function(p) { return p.name; });
  res.render('index', { providerNames: provs });
};