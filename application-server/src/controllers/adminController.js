const {ROLE_ADMIN, ROLE_DOCTOR, ROLE_PATIENT,createRedisClient} = require('../utils.js');
const network = require('../../../application-fabric/app/app.js');

exports.createPatient = async (req, res) => {
    // User role from the request header
    const userRole = req.user.role;
    // Set up and connect to Fabric Gateway using the username in header
    const networkObj = await network.connectToNetwork(req.user.username);
  
  
    if (!('patientId' in req.body) || req.body.patientId === null || req.body.patientId === '') {
      const lastId = await network.invoke(networkObj, true, userRole + 'Contract:getLatestPatientId');
      req.body.patientId = 'PID' + (parseInt(lastId.slice(3)) + 1);
    }
  
    // When password is not provided in the request while creating a patient record.
    if (!('password' in req.body) || req.body.password === null || req.body.password === '') {
      req.body.password = Math.random().toString(36).slice(-8);
    }
  
    req.body.changedBy = req.user.username;
  
    // The request present in the body is converted into a single json string
    const data = JSON.stringify(req.body);
    const args = [data];
    // Invoke the smart contract function
    const createPatientRes = await network.invoke(networkObj, false, userRole + 'Contract:createPatient', args);
    if (createPatientRes.error) {
      res.status(400).send(response.error);
    }
  
    // Enrol and register the user with the CA and adds the user to the wallet.
    const userData = JSON.stringify({hospitalId: req.user.hospitalId, userId: req.body.patientId});
    const registerUserRes = await network.registerUser(userData);
    if (registerUserRes.error) {
      await network.invoke(networkObj, false, userRole + 'Contract:deletePatient', req.body.patientId);
      res.send(registerUserRes.error);
    }
  
    res.status(201).send(`Successfully registered Patient: ${req.body.patientId} and Password: ${req.body.password}`);
};

exports.createDoctor = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    let { hospitalId, username, password } = req.body;
    hospitalId = parseInt(hospitalId);
  
    if(userRole !== ROLE_ADMIN ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role'});
    }
  
    req.body.userId = username;
    req.body.role = ROLE_DOCTOR;
    req.body = JSON.stringify(req.body);
    const args = [req.body];
    // Create a redis client and add the doctor to redis
    const redisClient = createRedisClient(hospitalId);
    (await redisClient).SET(username, password);
    // Enrol and register the user with the CA and adds the user to the wallet.
    const response = await network.registerUser(args);
    if (response.error) {
      (await redisClient).DEL(username);
      res.status(400).send(response.error);
    }
    res.status(201).send(`Successfully registered Doctor: ${username} and Password: ${password}`);
};

exports.viewPatients = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    // Set up and connect to Fabric Gateway using the username in header
    const networkObj = await network.connectToNetwork(req.user.username);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:queryAllPatients');
    const parsedResponse = await JSON.parse(response);
    res.status(200).send(parsedResponse);
};

exports.viewDoctors = async (req, res) => {
    const hospitalId = parseInt(req.params.hospitalId);
    // Set up and connect to Fabric Gateway
    userId = hospitalId === 1 ? 'hospital1admin' : hospitalId === 2 ? 'hospital2admin' : 'hospital3admin';
    const networkObj = await network.connectToNetwork(userId);
    // Use the gateway and identity service to get all users enrolled by the CA
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};