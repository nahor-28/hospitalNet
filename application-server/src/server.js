
// Classes for Node Express
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const fileUpload =  require('express-fileupload');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const doctors = require('../initDoctors.json');
const patients = require('./patients.json');

const {ROLE_ADMIN, ROLE_DOCTOR, ROLE_PATIENT,createRedisClient} = require('../utils.js');
require('dotenv').config();
const saltRounds = 10;
const accessTokenSecret = 'usertopsecret';

// Express Application init
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.use(fileUpload());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'ejs');

app.listen(3010, () => console.log('Backend server running on 3010'));

const network = require('../../application-fabric/app/app.js');
const ipfs = require('../ipfs');

const authenticateJWT = (req, res, next) => {
    
  const cookieToken = req.cookies.jwt;

  if (cookieToken) {

      jwt.verify(cookieToken, accessTokenSecret, (err, user) => {
          if (err) {
              return res.sendStatus(403);
          }
          req.user = user;
          next();
      });
  } else {
      res.sendStatus(401);
  }
};

app.get('/cookie', (req, res) => {
  const cook = req.cookies.jwt;
  res.send(cook);
})
//LOGIN ROUTE
app.get('/login', (req, res) => {
  res.render('login'); 
})
app.post('/login', async (req, res) => {
    // Read username and password from request body
    let {username, password, hospitalId, role} = req.body;
    hospitalId = parseInt(hospitalId);
    let user;
    // using get instead of redis GET for async
    if (role === ROLE_DOCTOR || role === ROLE_ADMIN) {
      const redisClient = await createRedisClient(hospitalId);
      const value = await redisClient.get(username);
      // comparing passwords
      user = value === password;
      if(!user) {
        res.status(404).send('Password No Match');
      }
      redisClient.quit();
    }
  
    if (role === ROLE_PATIENT) {
      const networkObj = await network.connectToNetwork(username);
      let newPassword = '';
      // if(req.body.newPassword !== null) {
      //   newPassword = req.body.newPassword;
      // }
  
      if (newPassword === null || newPassword === '') {
        // const value = await bcrypt.hash(password, saltRounds);
        const response = await network.invoke(networkObj, true, role + 'Contract:getPatientPassword', username);
        if (response.error) {
          res.status(400).send(response.error);
        } else {
          const parsedResponse = await JSON.parse(response);
          const patientPass = parsedResponse.password;
          const compPass = await bcrypt.compare(password, patientPass);
          console.log(compPass);
          if (!compPass) {
            (parsedResponse.pwdTemp === 'false') ?
              user = true :
              res.status(200).send('Change temporary password!');
          }
        }
      }
       else {
        let args = ({
          patientId: username,
          newPassword: newPassword,
        });
        args = [JSON.stringify(args)];
        const response = await network.invoke(networkObj, false, role + 'Contract:updatePatientPassword', args);
        (response.error) ? res.status(500).send(response.error) : user = true;
      }
    }
  
    if (user) {
      // Generate an access token
      const accessToken = jwt.sign({ username: username,  role: role, hospitalId: hospitalId }, accessTokenSecret, { expiresIn: 600 });

      res.cookie('jwt', accessToken, {maxAge: 600 * 1000, httpOnly: true, });
      role === ROLE_ADMIN ? res.redirect('/admin') : role === ROLE_DOCTOR ? res.redirect('/doctors') : res.redirect('/patients');
      // res.json(accessToken)
  } else {
      res.send({error: 'Username or password incorrect'});
  }

  // login a user
  // if role === admin || doctor => get password from redis
  // generate token and display respective dashboard
  // if role === patient => get password from ledger
  // generate JWT token
  // assign req.headers = role
  // display patient dashboard
});

app.get('/logout', async (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/login');
})
//ADMIN ROUTES 
// if doctor 
//    create client identity and store credentials in redis
// if patient
//    create client identity and update ledger

app.get('/admin', authenticateJWT, async (req, res) => {
  res.render('adminHome', { user: req.user });
});

app.get('/admin/register/patient', authenticateJWT, (req, res) => {
  res.render('adminRegisterPatient');
})
// CREATE PATIENT
app.post('/admin/register/patient', authenticateJWT, async (req, res) => {
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

  res.status(201).render('adminTemplate', { username: req.body.patientId, tempPass: req.body.password, role: 'patient' });
});

app.get('/admin/register/doctor', (req, res) => {
  res.render('adminRegisterDoc');
})
// // CREATE DOCTOR
app.post('/admin/register/doctor', authenticateJWT, async (req, res) => {
  // User role from the request header is validated
  const userRole = req.user.role;
  let { username, password } = req.body;
  let hospitalId = parseInt(req.user.hospitalId);

  if(userRole !== ROLE_ADMIN ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role'});
  }

  req.body.hospitalId = hospitalId;
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
  res.status(201).render('adminTemplate', { username: username, tempPass: password, role: 'doctor' });
});


// // admin gets patients name and doctors name

app.get('/admin/view/patients', authenticateJWT, async (req, res) => {
  // User role from the request header is validated
  const userRole = req.user.role;
  const username = req.user.username;
  // Set up and connect to Fabric Gateway using the username in header
  const networkObj = await network.connectToNetwork(username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:queryAllPatients');
  const parsedResponse = await JSON.parse(response);
  res.status(200).render('adminPatientView', { parsedResponse });
})

app.get('/admin/view/doctors/:hospitalId', authenticateJWT, async (req, res) => {
  const hospitalId = parseInt(req.params.hospitalId);
  // Set up and connect to Fabric Gateway
  userId = hospitalId === 1 ? 'hospital1admin' : hospitalId === 2 ? 'hospital2admin' : 'hospital3admin';
  const networkObj = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);
  // const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).render('adminDocsView', { response });
})



// DOCTOR ROUTES
// doctor can update patient medical details
// doctor can view patient medical details with their consent
app.get('/doctors', authenticateJWT, async (req, res) => {
  res.render('doctorHome', { user: req.user });
});

app.get('/doctors/view/patients', async (req, res) => {
  // User role from the request header is validated
  const userRole = 'doctor';
  const username = 'HOSP1-DOC0';
  if(userRole !== ROLE_DOCTOR ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Patients!'});
  }
  // Set up and connect to Fabric Gateway using the username in header
  const networkObj = await network.connectToNetwork(username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:queryAllPatients', username);
  const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).render('docViewPatients', { parsedResponse });
});

app.get('/doctors/view/:patientId/details',  async (req, res) => {
  const userRole = 'doctor';
  const patientId = req.params.patientId;
  if(userRole !== ROLE_DOCTOR ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Patients!'});
  }
  // Set up and connect to Fabric Gateway using the username in header
  const networkObj = await network.connectToNetwork('HOSP1-DOC0');
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:readPatient', patientId);
  const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).render('docPatientView', { parsedResponse });
}); 

app.get('/doctors/view/:patientId/history', async (req, res) => {
  // User role from the request header is validated
  const userRole = 'doctor';
  const patientId = req.params.patientId;
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork('HOSP1-DOC0');
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:getPatientHistory', patientId);
  const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(400).send(response.error) : res.status(200).render('docPatientHistory', {parsedResponse});
});

app.get('/doctors/update/:patientId/medicaldetails', async (req, res) => {
  const userRole = 'doctor';
  const patientId = req.params.patientId;
  if(userRole !== ROLE_DOCTOR ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Patients!'});
  }
  // Set up and connect to Fabric Gateway using the username in header
  const networkObj = await network.connectToNetwork('HOSP1-DOC0');
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:readPatient', patientId);
  const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).render('docEditMedicalDetails', { parsedResponse });
})

app.patch('/doctors/update/:patientId/medicaldetails', async (req, res) => {
  // User role from the request header is validated
  const userRole = 'doctor';
  const username = 'HOSP1-DOC0';
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
      args.changedBy = username;
      args.ehrFile = fileHash;

      args= [JSON.stringify(args)];
      console.log(args);

      fs.unlink(uploadPath, (err) => {
        if(err) console.log(err);
      })
      // Set up and connect to Fabric Gateway
      const networkObj = await network.connectToNetwork(username);
      // Invoke the smart contract function
      const response = await network.invoke(networkObj, false, userRole + 'Contract:updatePatientMedicalDetails', args);
      (response.error) ? res.status(500).send(response.error) : res.status(200).send('Successfully Updated Patient.');

  
  })
  
});


// PATIENT ROUTES
// patient can view own records
// can update personal data
// view doctors by hospital id
// grant and revoke access to doctors
app.get('/patients', authenticateJWT, async (req, res) => {
  res.render('patientHome', { user: req.user });
});

app.get('/patients/view/:patientId', authenticateJWT, async (req, res) => {
  // User role from the request header is validated
  const userRole = 'patient';
  const patientId = req.params.patientId;
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork(patientId);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:readPatient', patientId);
  const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(400).send(response.error) : res.status(200).render('patientViewSelf', { parsedResponse });
})

app.get('/patients/view/doctors/:hospitalId', authenticateJWT, async (req, res) => {
  // User role from the request header is validated
  const userRole = 'patient';
  const hospitalId = parseInt(req.params.hospitalId);
  if(userRole !== ROLE_PATIENT ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View Doctors!'});
  }
  // Set up and connect to Fabric Gateway
  userId = hospitalId === 1 ? 'hospital1admin' : hospitalId === 2 ? 'hospital2admin' : 'hospital3admin';
  const networkObj = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);
  (response.error) ? res.status(500).send(response.error) : res.status(200).render('patientDocList', { response: response, user: req.user });
});


app.get('/patients/view/:patientId/history', async (req, res) => {
  // User role from the request header is validated
  const userRole = 'patient';
  const patientId = req.params.patientId;
  if(userRole !== ROLE_PATIENT ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot View History!'});
  }
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork(patientId);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, userRole + 'Contract:getPatientHistory', patientId);
  const parsedResponse = await JSON.parse(response);
  (response.error) ? res.status(400).send(response.error) : res.status(200).render('patientHistory', { parsedResponse });
});

app.get('/patients/update/:patientId/personal', async (req, res) => {
    // User role from the request header is validated
    const userRole = 'patient';
    const patientId = req.params.patientId;
    // Set up and connect to Fabric Gateway
    const networkObj = await network.connectToNetwork(patientId);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, true, userRole + 'Contract:readPatient', patientId);
    const parsedResponse = await JSON.parse(response);
    (response.error) ? res.status(400).send(response.error) : res.status(200).render('patientEditPersonal', { parsedResponse });
})

app.patch('/patients/update/:patientId/personal', async (req, res) => {

  const userRole = 'patient';
  if(userRole !== ROLE_PATIENT ) {
    return res.sendStatus(401).json({message: 'Unauthorized Role. Cannot Update Personal Details!'});
  }
  // The request present in the body is converted into a single json string
  let args = req.body;
  args.patientId = 'PID1';
  args.changedBy = 'PID1';
  args= [JSON.stringify(args)];
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork('PID1');
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, userRole + 'Contract:updatePatientPersonalDetails', args);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send('Successfully Updated Patient.');
});

app.get('/patients/:patientId/grantaccess/:doctorId', (req, res) => {
  res.render('patientTemplate', { patient: req.params.patientId, doctor: req.params.doctorId, task: 'Granted' })
});

app.patch('/patients/:patientId/grantaccess/:doctorId',  async (req, res) => {
  // User role from the request header is validated
  const userRole = 'patient';
  const patientId = req.params.patientId;
  const doctorId = req.params.doctorId;
  let args = {patientId: patientId, doctorId: doctorId};
  args= [JSON.stringify(args)];
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork(patientId);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, userRole + 'Contract:grantAccessToDoctor', args);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(`Access granted to ${doctorId}`);
});

app.get('/patients/:patientId/revokeaccess/:doctorId', (req, res) => {
  res.render('patientTemplate', { patient: req.params.patientId, doctor: req.params.doctorId, task: 'Revoked' })
});
app.patch('/patients/:patientId/revokeaccess/:doctorId',  async (req, res) => {
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
});







app.get('/test/login', (req, res) => {
  res.render('login');
})
app.get('/test/register/doctor', (req, res) => {
  res.render('registerDoc');
})
app.get('/test/register/patient', (req, res) => {
  res.render('registerPatient');
})
app.get('/test/admin/docs', (req, res) => {
  res.render('adminDocsView', {doctors});
})
app.get('/test/admin/patients', (req, res) => {
  res.render('adminPatientView', {patients});
})
app.get('/test/doc/patients', (req, res) => {
  res.render('docViewPatients', {patients});
})
app.get('/test/doc/patient/details', (req, res) => {
  res.render('docPatientView', {pati});
})
app.get('/test/patient/view', (req, res) => {
  res.render('patientViewSelf');
})
app.get('/test/patient/docs', (req, res) => {
  res.render('patientDocList');
})