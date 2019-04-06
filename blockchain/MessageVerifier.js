const bitcoinMessage = require('bitcoinjs-message');

/**
 * Verifies if the given signature is authenticated against the given wallet address & timestamp
 * @param {*} address the wallet address
 * @param {*} timestamp the timestamp
 * @param {*} signature the signature
 */
var verifyMessageSignature = async (address, timestamp, signature) => {
    // let address = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ'
    // let signature = 'IJtpSFiOJrw/xYeucFxsHvIRFJ85YSGP8S1AEZxM4/obS3xr9iz7H0ffD7aM2vugrRaCi/zxaPtkflNzt5ykbc0='
    // let message = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532330740:starRegistry'
    try {
        let message = `${address}:${timestamp}:starRegistry`;
        return await bitcoinMessage.verify(message, address, signature);
    } catch (err) {
        return false;
    }
};

module.exports = {
    verifyMessageSignature
}

