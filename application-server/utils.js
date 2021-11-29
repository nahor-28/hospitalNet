
const redis = require('redis');
const util = require('util');

exports.ROLE_ADMIN = 'admin';
exports.ROLE_DOCTOR = 'doctor';
exports.ROLE_PATIENT = 'patient';

exports.CHANGE_TMP_PASSWORD = 'CHANGE_TMP_PASSWORD';

/**
 * @description Creates a redis client based on the hospitalID and allows promisify methods using util
 */
exports.createRedisClient = async function(hospitalId) {
  // TODO: Handle using config file
  let redisPassword;
  if (hospitalId === 1) {
    redisUrl = 'redis://127.0.0.1:6379';
    redisPassword = 'hospital1redis';
  } else if (hospitalId === 2) {
    redisUrl = 'redis://127.0.0.1:6380';
    redisPassword = 'hospital2redis';
  } else if (hospitalId === 3) {
    redisUrl = 'redis://127.0.0.1:6381';
    redisPassword = 'hospital3redis';
  }
  const redisClient = redis.createClient(redisUrl);
  redisClient.AUTH(redisPassword);
  // NOTE: Node Redis currently doesn't natively support promises
  // Util node package to promisify the get function of the client redis
  redisClient.get = util.promisify(redisClient.get);
  return redisClient;
};
