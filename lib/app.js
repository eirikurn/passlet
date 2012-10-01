
/**
 * Module dependencies.
 */

var express = require('express')
  , expressValidator = require('express-validator')
  , http = require('http')
  , path = require('path')

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

app.locals.list = function(arr) {
  var result = arr.slice(-1).join(', ');
  if (arr.length > 1)
    result = result + " and " + arr[arr.length-1];
  return result;
};

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
      console.log(user);
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
    next(e || (!user && new Error("Could not find bookmarklet.")));
  });
}

app.get('/', [skipUnlessAuthenticated, loadUser], routes.admin);

app.get('/', routes.index);
app.post('/signup', routes.signup);
app.get('/login', routes.login);

app.get('/bm/:bookmarkletId', loadUserFromBookmarklet, routes.bookmarkletScript);

app.get('/passbook/v1/passes/:passTypeIdentifier/:serialNumber', passes.getLatestVersion);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
