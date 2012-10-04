var uuid = require('node-uuid')
  , url = require('url');

var env = require('../env')
  , mailer = require('../mailer')
  , model = require('../model')
  , pass = require('../pass')
  , providers = require('../providers');

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
    model.LoginToken.create({email: email, token: uuid.v4()}, sendEmail);
  };

  var sendEmail = function(e, login) {
    if (e) return next(e);

    var context = {
      email: email,
      loginUrl: env.PASSLET_BASE_URL + '/login?token=' + login.token,
      domain: url.parse(env.PASSLET_BASE_URL).host
    };

    // Let's keep it simple for development.
    if (!mailer.configured) {
      res.redirect(context.loginUrl);
      return;
    }

    // Otherwise, render and send a login email.
    req.app.render('loginEmail.jade', context, function(e, html) {
      if (e) return next(e);

      var mailInfo = {
        to: email,
        html: html,
        subject: 'Login link for ' + context.domain
      }
      mailer.sendMail(mailInfo, function(e) {
        if (e) return next(e);
        
        res.render('loginsent', context);
      });
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

/**
 * Serves the script that the bookmarklet fetches. Depends
 * on provider (domain) and user.
 */
exports.bookmarkletScript = function(req, res, next) {
  var domain = req.param('d')
    , provider = getProviderFromDomain(domain)
    , context;

  context = {
    provider: provider,
    user: req.user
  }
  res.type('text/javascript');
  res.render('scrape.js', context);
};

exports.validateCreatePass = function(req, res, next) {
  var origin = req.header('Origin')
    , provider = getProviderFromDomain(url.parse(origin).hostname);

  // Only support origins matching one of our providers.
  if (!provider)
    return res.send();

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type');
  //res.header('Access-Control-Max-Age', 60*60*24);
  res.send();
};

/**
 * Creates a pass.
 */
exports.createPass = function(req, res, next) {
  var origin = req.header('Origin')
    , provider = getProviderFromDomain(url.parse(origin).hostname);

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type');

  pass.createPass(provider, req.body, function(e, pass) {
    res.send({status: "success"});
  });
};

/**
 * Finds a provider from the specific domain.
 */
var getProviderFromDomain = function(domain) {
  var provider;
  while (domain && !provider) {
    provider = providers.getProvider(domain);
    domain = domain.split('.').slice(1).join('.');
  }
  return provider
};

/**
 * Creates a bookmarklet for the specified user.
 */
var createBookmarklet = function(app, user, cb) {
  var context = {
    baseUrl: env.PASSLET_BASE_URL,
    bookmarkletId: user.bookmarklet,
    minify: true
  };

  // Render the bookmarklet.
  app.render('bookmarklet.js', context, function(e, js) {
    if (e)
      return cb(e);

    cb(null, "javascript:" + js);
  });
};

