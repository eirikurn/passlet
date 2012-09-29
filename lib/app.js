
/**
 * Module dependencies.
 */

var express = require('express')
  , expressValidator = require('express-validator')
  , http = require('http')
  , path = require('path')

  , routes = require('./routes')
  , passes = require('./routes/passes');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
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

app.get('/passbook/v1/passes/:passTypeIdentifier/:serialNumber', passes.getLatestVersion);

app.get('/', routes.index);
app.post('/passlet', routes.createPasslet);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
