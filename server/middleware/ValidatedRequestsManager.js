/**
 * Handles the already validated requests that are awaiting to be registered as stars. All of these have been VALIDATED !!
 */
const db = require('./../../db/levelValidated.js');

class ValidatedRequestsManager{
    constructor(){}
    
    // async isWaitingForStarRegistration(address){
    //     let isWaitingForStarRegistration = true;
    //     try{
    //         let entry = await db.getAddress(address);
    //         if (entry == null || entry == undefined){
    //             isWaitingForStarRegistration = false;
    //         }
    //     }catch (err){
    //         isWaitingForStarRegistration = false;
    //     }
    //     return isWaitingForStarRegistration;
    // }
    
    async isRequestValidated(address){
        try {
            let isValidated = await db.getAddress(address);
            if (isValidated == null || isValidated == undefined){
                isValidated = false;
            }
            return isValidated;
        } catch (err){
            return false;
        }
    }

    async storeValidatedRequest(address, timestamp){
        try {
            await db.saveAddress(address,timestamp);
        }catch (err){
            throw new Error('Unable to store validated request into db');
        }

    }
    async removeValidatedRequest(address){
        try {
            await db.deleteAddress(address);
        } catch(err){
            throw new Error (`Unable to remove ${address} from db`);
        }
    }
}

module.exports = {
    ValidatedRequestsManager
}