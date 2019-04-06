/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
var validatedDBLocation = './validateddata';
if (process.env.NODE_ENV === 'test'){
    validatedDBLocation = './validateddata_test';
}
var validationDB = level(validatedDBLocation);

/**
 * Persist an entry/address/wallet/user to the validated database 
 * @param {*} address the wallet address
 * @param {*} timestamp timestamp of the recording
 *  */
var saveAddress = async (address, timestamp) => {
    await validationDB.put(address, timestamp);
    return;
}

/**
 * Get the given recording
 * @param {*} address the recording address
 */
var getAddress = async (address) => {
    try {
        let item = await validationDB.get(address);
        return item;
    } catch(err){
        return null;
    }    
}

/**
 * Get the size of the database
 */
var getSize = () => {
    let i = 0;
    return new Promise ((resolve, reject) => {
        validationDB.createReadStream()
            .on('data', (data) => {i++;})
            .on('error', (err) => { reject( `Unable to read data stream! because  ${err.message}`)})
            .on('close', ()=> { resolve(i);});
    });
}

/**
 * Delete the given recording/address
 * @param {*} address the address to delete
 */
var deleteAddress = async (address) => {
    return await validationDB.del(address);
}

var deleteAllAddresses = async () => {
    let deleteOps = await getDeleteOpsKeys();
    await validationDB.batch(deleteOps);
    return;
}

var getDeleteOpsKeys = () =>{
    let keyEntries = [];
    let type = 'del';
    return new Promise((resolve, reject) => { 
        validationDB.createReadStream({ keys: true, values: false })
            .on('data', (key) => {
                keyEntries.push({type, key});
            })
            .on('close', ()=> { resolve(keyEntries);});   
    });
}

module.exports = {
    saveAddress,
    getAddress,
    getSize,
    deleteAddress,
    deleteAllAddresses
}

