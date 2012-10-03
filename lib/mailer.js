var nodemailer = require('nodemailer')
  , url = require('url')

  , env = require('./env');

/**
 * Parses a single config url to configure and create nodemailer's Transport.
 */
var createTransport = function(config) {
  var uri = url.parse(config, true)
    , type = uri.protocol.replace(':', '')
    , query = uri.query
    , transport = {};

  if (type.toLowerCase() === 'smtps') {
    transport.secureConnection = true;
    type = 'smtp';
  }

  if (uri.hostname === 'service')
    transport.service = uri.pathname.replace('/', '');
  else
    transport.host = uri.hostname;

  if (uri.port)
    transport.port = parseInt(uri.port, 10);

  if (uri.auth)
    transport.auth = {
      user: uri.auth.split(':')[0],
      pass: uri.auth.split(':')[1]
    };

  if (uri.query.name)
    transport.name = query.name;

  if (uri.query.debug)
    transport.debug = query.debug === 'true';

  if (uri.query.maxConnections)
    transport.maxConnections = parseInt(query.maxConnections, 10);

  if (uri.query.ignoreTLS)
    transport.ignoreTLS = query.ignoreTLS === 'true';

  if (uri.query.secureConnection)
    transport.secureConnection = query.secureConnection === 'true'

  return nodemailer.createTransport(type, transport);
}

module.exports = createTransport(env.EMAIL_TRANSPORT);
module.exports.options.from = env.EMAIL_FROM;
