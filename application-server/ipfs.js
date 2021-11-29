const { create } = require('ipfs-http-client');
const fs = require('fs');

const ipfs = create();

exports.addFile = async (fileName, filePath) => {
    
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({ path: fileName, content: file});
    const fileHash = fileAdded.cid.toString();

    return fileHash;
    // console.log(fileAdded.cid.toString());
}


