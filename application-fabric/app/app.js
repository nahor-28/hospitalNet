/**
 * @desc The file which interacts with the fabric network.
 */


const {Gateway, Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const {buildCAClient, registerAndEnrollUser} = require('./CAUtil.js');
const {buildCCPHosp3, buildCCPHosp2, buildCCPHosp1, buildWallet} = require('./AppUtil.js');

const channelName = 'hospitalchannel';
const chaincodeName = 'patient';
const mspOrg1 = 'Hospital1MSP';
const mspOrg2 = 'Hospital2MSP';
const mspOrg3 = 'Hospital3MSP';
const walletPath = path.join(__dirname, 'wallet');



exports.connectToNetwork = async function(doctorID) {
  const gateway = new Gateway();
  const ccp = buildCCPHosp1();

  try {
    // const walletPath = path.join(process.cwd(), '../application-fabric/app/wallet/');

    const wallet = await buildWallet(Wallets, walletPath);

    const userExists = await wallet.get(doctorID);
    if (!userExists) {
      console.log('An identity for the userID: ' + doctorID + ' does not exist in the wallet');
      console.log('Create the userID before retrying');
      const response = {};
      response.error = 'An identity for the user ' + doctorID + ' does not exist in the wallet. Register ' + doctorID + ' first';
      return response;
    }

    await gateway.connect(ccp, {wallet, identity: doctorID, discovery: {enabled: true, asLocalhost: true}});

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    const networkObj = {
      contract: contract,
      network: network,
      gateway: gateway,
    };
    console.log('Succesfully connected to the network.');
    return networkObj;
  } catch (error) {
    console.log(`Error processing transaction. ${error}`);
    console.log(error.stack);
    const response = {};
    response.error = error;
    return response;
  }
};


/**
 * @description A common function to interact with the ledger
 */
exports.invoke = async function(networkObj, isQuery, func, args= '') {
  try {
    if (isQuery === true) {
      const response = await networkObj.contract.evaluateTransaction(func, args);
      console.log(response);
      await networkObj.gateway.disconnect();
      return response;
    } 
    else {
      if (args) {
        args = JSON.parse(args[0]);
        args = JSON.stringify(args);
      }
      const response = await networkObj.contract.submitTransaction(func, args);
      console.log(response);
      await networkObj.gateway.disconnect();
      return response;
    }
  } catch (error) {
    const response = {};
    response.error = error;
    console.error(`Failed to submit transaction: ${error}`);
    return response;
  }
};

/**
 * @description Creates a patient/doctor and adds to the wallet to the given hospitalId
 */
exports.registerUser = async function(attributes) {
  const attrs = JSON.parse(attributes);
  console.log(attrs);
  const hospitalId = attrs.hospitalId;
  const userId = attrs.userId;

  if (!userId || !hospitalId) {
    const response = {};
    response.error = 'Error! You need to fill all fields before you can register!';
    return response;
  }

  try {
    const wallet = await buildWallet(Wallets, walletPath);
    if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital1.project.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, 'hospital1admin', attributes);
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital2.project.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg2, userId, 'hospital2admin', attributes);
    } else if (hospitalId === 3) {
      const ccp = buildCCPHosp3();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital3.project.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg3, userId, 'hospital3admin', attributes);
    }
    console.log(`Successfully registered user: + ${userId}`);
    const response = 'Successfully registered user: '+ userId;
    return response;
  } catch (error) {
    console.error(`Failed to register user + ${userId} + : ${error}`);
    const response = {};
    response.error = error;
    return response;
  }
};

exports.getAllDoctorsByHospitalId = async function(networkObj, hospitalId) {
  // Get the User from the identity context
  const users = networkObj.gateway.identityContext.user;
  let caClient;
  const result = [];
  try {
    // TODO: Must be handled in a config file instead of using if
    if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital1.project.com');
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital2.project.com');
    } else if (hospitalId === 3) {
      const ccp = buildCCPHosp3();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital3.project.com');
    }

    // Use the identity service to get the user enrolled using the respective CA
    const idService = caClient.newIdentityService();
    const userList = await idService.getAll(users);

    // for all identities the attrs can be found
    const identities = userList.result.identities;

    for (let i = 0; i < identities.length; i++) {
      tmp = {};
      if (identities[i].type === 'client') {
        tmp.id = identities[i].id;
        tmp.role = identities[i].type;
        attributes = identities[i].attrs;
        // Doctor object will consist of firstName and lastName
        for (let j = 0; j < attributes.length; j++) {
          if (attributes[j].name.endsWith('Name') || attributes[j].name === 'role' || attributes[j].name === 'speciality') {
            tmp[attributes[j].name] = attributes[j].value;
          }
        }
        result.push(tmp);
      }
    }
  } catch (error) {
    console.error(`Unable to get all doctors : ${error}`);
    const response = {};
    response.error = error;
    return response;
  }
  return result.filter(
    function(result) {
      return result.role === 'doctor';
    },
  );
};
