/* eslint-disable new-cap */
const fs = require('fs');
const {enrollAdminHosp1} = require('./enrollAdmin-Hospital1');
const {enrollAdminHosp2} = require('./enrollAdmin-Hospital2');
const {enrollRegisterUser} = require('./registerUser');
const {createRedisClient} = require('./utils');

const redis = require('redis');


/**
 * @description Enrolls and registers the patients in the initLedger as users.
 */
async function initLedger() {
  try {
    const jsonString = fs.readFileSync('../application-fabric/chaincode/lib/initLedger.json');
    const patients = JSON.parse(jsonString);
    let i = 0;
    for (i = 0; i < patients.length; i++) {
      const attr = {firstName: patients[i].firstName, lastName: patients[i].lastName, role: 'patient'};
      await enrollRegisterUser('1', 'PID'+i, JSON.stringify(attr));
    }
  } catch (err) {
    console.log(err);
  }
}
/**
 * @description Init the redis db with the admins credentials
 */
async function initRedis() {
  let redisUrl = 'redis://127.0.0.1:6379';
  let redisPassword = 'hospital1redis';
  let redisClient = redis.createClient(redisUrl);
  redisClient.AUTH(redisPassword);
  redisClient.SET('hospital1admin', 'hospital1adminpw');
  redisClient.QUIT();

  redisUrl = 'redis://127.0.0.1:6380';
  redisPassword = 'hospital2redis';
  redisClient = redis.createClient(redisUrl);
  redisClient.AUTH(redisPassword);
  redisClient.SET('hospital2admin', 'hospital2adminpw');
  console.log('Done');
  redisClient.QUIT();
  return;
}

/**
 * @description Create doctors in both organizations based on the initDoctors JSON
 */
async function enrollAndRegisterDoctors() {
  try {
    const jsonString = fs.readFileSync('./initDoctors.json');
    const doctors = JSON.parse(jsonString);
    for (let i = 0; i < doctors.length; i++) {
      const attr = {firstName: doctors[i].firstName, lastName: doctors[i].lastName, role: 'doctor', speciality: doctors[i].speciality};
      // Create a redis client and add the doctor to redis
      doctors[i].hospitalId = parseInt(doctors[i].hospitalId);
      const redisClient = createRedisClient(doctors[i].hospitalId);
      (await redisClient).SET('HOSP' + doctors[i].hospitalId + '-' + 'DOC' + i, 'password');
      await enrollRegisterUser(doctors[i].hospitalId, 'HOSP' + doctors[i].hospitalId + '-' + 'DOC' + i, JSON.stringify(attr));
      (await redisClient).QUIT();
    }
  } catch (error) {
    console.log(error);
  }
};


async function main() {
  await enrollAdminHosp1();
  await enrollAdminHosp2();
  await initLedger();
  await initRedis();
  await enrollAndRegisterDoctors();
}


main();
