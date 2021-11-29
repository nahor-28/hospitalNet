
const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const {buildCAClient, registerAndEnrollUser} = require('../application-fabric/app/CAUtil.js');
const walletPath = path.join(__dirname, '/../application-fabric/app/wallet');
const {buildCCPHosp1, buildCCPHosp2, buildWallet, buildCCPHosp3} = require('../application-fabric/app/AppUtil.js');
let mspOrg;
let adminUserId;
let caClient;


exports.enrollRegisterUser = async function(hospitalId, userId, attributes) {
  try {
    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);
    hospitalId = parseInt(hospitalId);

    if (hospitalId === 1) {
      // build an in memory object with the network configuration (also known as a connection profile)
      const ccp = buildCCPHosp1();

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital1.project.com');

      mspOrg = 'Hospital1MSP';
      adminUserId = 'hospital1admin';
    } else if (hospitalId === 2) {
      // build an in memory object with the network configuration (also known as a connection profile)
      const ccp = buildCCPHosp2();

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital2.project.com');

      mspOrg = 'Hospital2MSP';
      adminUserId = 'hospital2admin';
    } else if (hospitalId === 3) {
      // build an in memory object with the network configuration (also known as a connection profile)
      const ccp = buildCCPHosp3();

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital3.project.com');

      mspOrg = 'Hospital3MSP';
      adminUserId = 'hospital3admin';
    }
    // enrolls users to Hospital 1 and adds the user to the wallet
    await registerAndEnrollUser(caClient, wallet, mspOrg, userId, adminUserId, attributes);
    console.log('msg: Successfully enrolled user ' + userId + ' and imported it into the wallet');
  } catch (error) {
    console.error(`Failed to register user "${userId}": ${error}`);
    process.exit(1);
  }
};
