
/**
 * Module dependencies.
 */

var express = require('express')
  , expressValidator = require('express-validator')
  , http = require('http')
  , path = require('path')
  , ejs = require('ejs')
  , uglify = require('uglify-js')

  , env = require('./env')
  , model = require('./model')
  , routes = require('./routes')
  , passes = require('./routes/passes');

var app = express();

app.configure(function(){
  app.set('port', env.PORT);
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser(env.PASSLET_SECRET));
  app.use(express.bodyParser());
  app.use(expressValidator);
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, '../public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * Render js files using ejs for variable interpolation.
 * With or without minification.
 */
app.engine('js', function(file, opts, cb) {
  ejs.renderFile(file, opts, function(e, js) {
    if (e)
      return cb(e);

    if ('minify' in opts ? opts.minify : env.PASSLET_MINIFY) {
      try {
        js = uglify.parser.parse(js);       // parse code and get the initial AST
        js = uglify.uglify.ast_mangle(js);  // get a new AST with mangled names
        js = uglify.uglify.ast_squeeze(js); // get an AST with compression optimizations
        js = uglify.uglify.gen_code(js);    // compressed code here
      } catch(e) {
        return cb(e);
      }
    }
    cb(null, js);
  });
});

app.locals.list = function(arr) {
  var result = arr.slice(-1).join(', ');
  if (arr.length > 1)
    result = result + " and " + arr[arr.length-1];
  return result;
};

app.locals.indent = function(str, spaces) {
  return str.replace(/^/mg, new Array(spaces+1).join(' '));
};

app.locals.env = env;

/**
 * A route middleware to only render this route if logged in.
 */
var skipUnlessAuthenticated = function(req, res, next) {
  if (req.signedCookies.session) {
    next();
  } else {
    next('route');
  }
};

/**
 * A route middleware that loads the currently logged in user into req.
 */
var loadUser = function(req, res, next) {
  if (req.signedCookies.session) {
    model.User.findOne({email: req.signedCookies.session.email}, function(e, user) {
      req.user = user;
      next(e || (!user && new Error("Not logged in.")));
    });
  } else {
    next(new Error('Not logged in.'));
  }
}

/**
 * A route middleware that loads a user into req based on the bookmarkletId provided.
 */
var loadUserFromBookmarklet = function(req, res, next) {
  var bmId = req.param('bookmarkletId');
  model.User.findOne({bookmarklet: bmId}, function(e, user) {
    req.user = user;
    next(e);
  });
}

app.get('/', skipUnlessAuthenticated, loadUser, routes.admin);

app.get('/', routes.index);
app.post('/signup', routes.signup);
app.get('/login', routes.login);

app.get('/bm/:bookmarkletId', loadUserFromBookmarklet, routes.bookmarkletScript);
app.options('/pass/:bookmarkletId', routes.validateCreatePass);
app.post('/pass/:bookmarkletId', loadUserFromBookmarklet, routes.createPass);

app.get('/passbook/v1/passes/:passTypeIdentifier/:serialNumber', passes.getLatestVersion);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
