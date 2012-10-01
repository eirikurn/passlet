var uuid = require('node-uuid');

var providers = require('../providers')
  , model = require('../model')
  , env = require('../env');

/*
 * GET home page.
 */
exports.index = function(req, res, next) {
  var provs = providers.getProviders();
  provs = provs.map(function(p) { return p.name; });

  res.render('index', {
    providerNames: provs,
    errors: req.validationErrors(true)
  });
};

/*
 * POST signup with email.
 */
exports.signup = function(req, res, next) {
  // Validate
  req.assert('email', 'Valid email required').notEmpty().isEmail();

  if (req.validationErrors()) {
    return exports.index(req, res);
  }

  var email = req.param('email');

  // Reuse existing user if he exists
  model.User.findOne({email: email}, function(e, user) {
    if (e) return next(e);
    if (!user) {
      model.User.create({email: email}, createLoginToken);
    } else {
      createLoginToken();
    }
  });

  var createLoginToken = function(e) {
    if (e) return next(e);

    // Create a login token
    model.LoginToken.create({email: email, token: uuid.v4()}, function(e, login) {
      if (e) return next(e);

      // TODO: Send logintoken in email instead.
      res.redirect('/login?token=' + login.token);
    });
  };
};

/*
 * GET login from token.
 */
exports.login = function(req, res, next) {
  var token = req.param('token');

  model.LoginToken.findOneAndRemove({token: token}, function(e, login) {
    if (!login)
      return res.send(404, 'Token not found. Have you clicked this link before? If so, get a new email by signing up on the front page.');

    res.cookie('session', {email: login.email}, {path: '/', signed: true, httpOnly: true});
    res.redirect('/');
  });
};

/*
 * GET home page with session.
 */
exports.admin = function(req, res, next) {
  // Render the bookmarklet
  createBookmarklet(req.app, req.user, function(e, bookmarklet) {
    if (e) 
      return next(e);

    res.render('admin', {
      session: req.signedCookies.session,
      bookmarklet: bookmarklet
    });
  });
};

exports.bookmarkletScript = function(req, res, next) {
  res.send("alert('Hi " + req.user.email + " at " + req.param('d') + "');");
};

/**
 * Creates a bookmarklet for the specified user.
 */
var createBookmarklet = function(app, user, cb) {
  var context = {
    baseUrl: env.PASSLET_BASE_URL,
    bookmarkletId: user.bookmarklet
  };

  // Render the bookmarklet.
  app.render('bookmarklet.ejs', context, function(e, html) {
    var js, ast
      , jsp = require("uglify-js").parser
      , pro = require("uglify-js").uglify;

    if (e) 
      return cb(e);
    try {
      // Try and compress the bookmarklet
      ast = jsp.parse(html); // parse code and get the initial AST
      ast = pro.ast_mangle(ast); // get a new AST with mangled names
      ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
      js = "javascript:" + pro.gen_code(ast); // compressed code here

      // Return it
      cb(null, js);

    } catch(e) {
      cb(e);
    }
  });
};

