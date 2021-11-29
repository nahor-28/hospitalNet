const {ROLE_ADMIN, ROLE_DOCTOR, ROLE_PATIENT} = require('../utils.js');
const network = require('../../../application-fabric/app/app.js');

exports.viewPatients = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const username = req.user.username;
    if(userRole !== ROLE_DOCTOR ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Patients!'});
    }
    // Set up and connect to Fabric Gateway using the username in header
    const networkObj = await network.connectToNetwork(username);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:queryAllPatients', username);
    // const parsedResponse = await JSON.parse(response);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(JSON.parse(response));
};

exports.patientDetails = async (req, res) => {
    const userRole = req.user.role;
    const patientId = req.params.patientId;
    if(userRole !== ROLE_DOCTOR ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Patients!'});
    }
    // Set up and connect to Fabric Gateway using the username in header
    const networkObj = await network.connectToNetwork(req.user.username);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:readPatient', patientId);
    // const parsedResponse = await JSON.parse(response);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(JSON.parse(response));
};

exports.patientHistory = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const patientId = req.params.patientId;
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(req.user.username);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:getPatientHistory', patientId);
    const parsedResponse = await JSON.parse(response);
    (response.error) ? res.status(400).send(response.error) : res.status(200).send(parsedResponse);
};

exports.updateDetails = async (req, res) => {
    // User role from the request header is validated
    const userRole = req.user.role;
    const username = req.user.username;
    if(userRole !== ROLE_DOCTOR ) {
      return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot Update.'});
    }
  
    const uploadedFile = req.files.ehrfile;
    const fileName = uploadedFile.name;
    const uploadPath = __dirname + '/uploads/' + '_' + fileName;
    console.log(uploadedFile);
    console.log(uploadPath);
  
    uploadedFile.mv(uploadPath, async (err) => {
        if(err) {
            console.log('Error: Failed to download!');
            return res.status(500).send(err);
        }
        fileHash = await ipfs.addFile(fileName, uploadPath);
        let args = req.body;
        args.patientId = req.params.patientId;
        // args.changedBy = username;
        args.ehrFile = fileHash;
  
        args= [JSON.stringify(args)];
        console.log(args)
        res.send(args);
        // Set up and connect to Fabric Gateway
        const networkObj = await network.connectToNetwork(username);
        // Invoke the smart contract function
        const response = await network.invoke(networkObj, false, userRole + 'Contract:updatePatientMedicalDetails', args);
        (response.error) ? res.status(500).send(response.error) : res.status(200).send('Successfully Updated Patient.');
  
        fs.unlink(uploadPath, (err) => {
            if(err) console.log(err);
        })
    
    })
    
};