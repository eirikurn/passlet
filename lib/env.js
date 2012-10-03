
/**
 * Validate environment.
 */
var requiredAlways = ['EMAIL_TRANSPORT', 'EMAIL_FROM'] // Try to reduce this to nothin.
 , requiredInProduction = ['PASSLET_SECRET', 'PASSLET_BASE_URL'];

requiredAlways.forEach(function(k) {
  if (!process.env[k]) {
    console.log("ERROR: Missing environment variable ", k);
    process.exit(1);
  }
});

if (process.env.NODE_ENV === 'production') {
  requiredInProduction.forEach(function(k) {
    if (!process.env[k]) {
      console.log("ERROR: Missing environment variable ", k);
      process.exit(1);
    }
  });
}


/**
 * Process and store relevant environment variables.
 */
exports.PORT = process.env.PORT || '3000';

exports.PASSLET_SECRET = process.env.PASSLET_SECRET || "development";

exports.PASSLET_BASE_URL = process.env.PASSLET_BASE_URL || "http://localhost:3000";

exports.PASSLET_MINIFY = 
    'PASSLET_MINIFY' in process.env
  ? process.env.PASSLET_MINIFY === 'yes' 
  : process.env.NODE_ENV === 'production';

exports.MONGO_DB = process.env.MONGO_DB || "mongodb://localhost/passes";

exports.EMAIL_TRANSPORT = process.env.EMAIL_TRANSPORT;
exports.EMAIL_FROM = process.env.EMAIL_FROM;