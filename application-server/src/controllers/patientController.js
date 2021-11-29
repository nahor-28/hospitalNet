const {ROLE_ADMIN, ROLE_DOCTOR, ROLE_PATIENT} = require('../utils.js');
const network = require('../../../application-fabric/app/app.js');

exports.viewPatient = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const patientId = req.user.username;
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(patientId);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:readPatient', patientId);
    (response.error) ? res.status(400).send(response.error) : res.status(200).send(JSON.parse(response));
};

exports.viewDoctors = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const hospitalId = req.user.hospitalId;
    if(userRole !== ROLE_PATIENT ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Doctors!'});
    }
    // Set up and connect to Fabric Gateway
    userId = hospitalId === 1 ? 'hospital1admin' : hospitalId === 2 ? 'hospital2admin' : 'hospital3admin';
    const networkObj = await network.connectToNetwork(userId);
    // Use the gateway and identity service to get all users enrolled by the CA
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};

exports.patientHistory = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const patientId = req.user.username;
    if(userRole !== ROLE_PATIENT ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View History!'});
    }
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(patientId);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:getPatientHistory', patientId);
    const parsedResponse = await JSON.parse(response);
    (response.error) ? res.status(400).send(response.error) : res.status(200).send(parsedResponse);
};

exports.updateDetails = async (req, res) => {

    const userRole = req.user.role;
    if(userRole !== ROLE_PATIENT ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot Update Personal Details!'});
    }
    // The request present in the body is converted into a single json string
    let args = req.body;
    args.patientId = req.user.username;
    args.changedBy = req.user.username;
    args= [JSON.stringify(args)];
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(req.user.username);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, false, userRole + 'Contract:updatePatientPersonalDetails', args);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send('Successfully Updated Patient.');
};

exports.grantAccess = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const patientId = req.user.username;
    const doctorId = req.params.doctorId;
    let args = {patientId: patientId, doctorId: doctorId};
    args= [JSON.stringify(args)];
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(patientId);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, false, userRole + 'Contract:grantAccessToDoctor', args);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(`Access granted to ${doctorId}`);
};

exports.revokeAccess = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const patientId = req.user.username;
    const doctorId = req.params.doctorId;
    let args = {patientId: patientId, doctorId: doctorId};
    args= [JSON.stringify(args)];
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(patientId);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, false, userRole + 'Contract:revokeAccessFromDoctor', args);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(`Access revoked from ${doctorId}`);
};