/**
 * Manages the validation process. Takes care of the temporarly ValidationMempool and the ValidatedRequestsManager
 * Server asks this component to deal with requests for validation and verification/allowence for star registration
 */
const {RegistrationError} = require('./RegistrationError.js');
const messageVerifier = require('./../../blockchain/MessageVerifier.js');
class ValidationManager{
    /**
     * Constructor
     * @param {*} requestManager the mempool or reqeuests to validate
     * @param {*} validatedRequestsManager the manager that handles the already accepted /validated requests
     */
    constructor(requestManager, validatedRequestsManager){
        this.requestManager = requestManager;
        this.validatedRequestsManager = validatedRequestsManager;
    }

    /**
     * Registers a request to register a star
     * @param {*} address star address
     */
    async registerRequest(address) {
        //First check into Mempool. If not there, check in validatedRequests. If not there, put in mempool.
        if (this.requestManager.isRequestRegistered(address) == false) {
            let isRequestValidated = await this.validatedRequestsManager.isRequestValidated(address);
            if (isRequestValidated == false) {
                return await this.requestManager.addRequest(address);
            } else {
                throw new Error(`Address ${address} has already been registered and validated!`);
            }
        } else {
            throw new RegistrationError(this.getRegistrationRequestTime(address));
        }
    }

    /**
     * Attempts to validate the request. It will fail if request has not been previously registered/expired OR signature cannot be confirmed
     * @param {*} address User's address/wallet
     */
    async isRequestValid(address, signature){
        let requestRegistrationTime = this.requestManager.getRequest(address);
        if(requestRegistrationTime == null || requestRegistrationTime == undefined){
            throw new Error('You must register first before attempting to validate a request!');
        }
        if (parseInt(new Date().getTime().toString().slice(0,-3)) - parseInt(requestRegistrationTime) > 300){
            throw new Error('Validation time window expired! Allowed only for 300 seconds!');
        }
        let isMessageSignatureValid = await messageVerifier.verifyMessageSignature(address, requestRegistrationTime, signature);
        return isMessageSignatureValid;
    }

    getRegistrationRequestTime(address){
        let time = this.requestManager.getRequest(address);
        if (time == null || time == undefined){
            throw new Error('You must register first before attempting to validate a request!');
        } 
        return time;
    }

    /**
     * Confims the request validation. Deletes from mempool and writes to the DB, allowing the user to register a star at some point in the future
     * @param {*} address 
     */
    async confirmValidation(address){
        try {
            let date = this.requestManager.getRequest(address);
            this.requestManager.removeRequest(address);
            await this.validatedRequestsManager.storeValidatedRequest(address, date);
            return date;
        } catch(err){
            throw new Error('Unable to confirm validation due to an internal error');
        }
    }

    /**
     * Has the request/address been validated
     * @param {*} address the address to check if has been validated (and waiting for star registration)
     */
    async hasBeenValidated(address){
        return await this.validatedRequestsManager.isRequestValidated(address);
    }
    
    /**
     * Removed the validated item from the 
     * @param {*} address 
     */
    async removeValidation(address){
        try{
            await this.validatedRequestsManager.removeValidatedRequest(address);
        } catch(err){
            throw new Error('Unable to remove request from validation db');
        }
    }

    async clearEverything(){
        await this.requestManager.clearAllRequests();
    }
}
module.exports = {
    ValidationManager
}