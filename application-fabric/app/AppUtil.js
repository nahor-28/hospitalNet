
const fs = require('fs');
const path = require('path');

// Build CCP JSON Object
exports.buildCCPHosp1 = () => {
  const ccpPath = path.resolve(__dirname, '..', '..', 'test-network',
    'organizations', 'peerOrganizations', 'hospital1.project.com', 'connection-hospital1.json');
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};

// Build CCP JSON Object
exports.buildCCPHosp2 = () => {
  const ccpPath = path.resolve(__dirname, '..', '..', 'test-network',
    'organizations', 'peerOrganizations', 'hospital2.project.com', 'connection-hospital2.json');
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};

// Build CCP JSON Object
exports.buildCCPHosp3 = () => {
  const ccpPath = path.resolve(__dirname, '..', '..', 'test-network',
    'organizations', 'peerOrganizations', 'hospital3.project.com', 'connection-hospital3.json');
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};


exports.buildWallet = async (Wallets, walletPath) => {
  let wallet;
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Built a file system wallet at ${walletPath}`);
  } else {
    wallet = await Wallets.newInMemoryWallet();
    console.log('Built an in memory wallet');
  }

  return wallet;
};


exports.prettyJSONString = (inputString) => {
  if (inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
  } else {
    return inputString;
  }
};
