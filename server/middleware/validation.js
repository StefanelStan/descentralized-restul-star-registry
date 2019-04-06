/* Basically here we need to do 2 things:
Can have 2 extra DBs:
1. Pending verifications
2. Authorized to registerOnce
When we authorize to register, we remove from pending verifications and put it to authorized to register once.
3. When we post a block/and register a star, the entry is removed from authorized to register and saved into the BC
----
1. Verify IF the user has the right to register a star (can read from DB by wallet address) -rightToRegister
2. IF he has the right, then register and remove him from rightToRegister DB.
*/

/*
// logger.js
var bunyan = require('bunyan');
var logger;
function getMainLogger(opts) {
  opts = opts || {};
  Page on opts.name  = Page on opts.name || 'MainService';
  if (logger) {
    return logger;
  else {
    // opts omitted for brevity
    logger = bunyan.createLogger(opts);
    logger.info('Main logger initialized.');
    return logger;
  }
}
 
function get(componentName) {
  return getMainLogger().child({component: componentName});
};

module.exports = {
  get: get
};


// some-controller.js
var logger = require('./logger').get();
logger.info('From some controller');

// another-controller.js
var logger = require('./logger').get();
logger.info('From another controller');

// main.js
require('./some-controller');
require('./another-controller');

*/
