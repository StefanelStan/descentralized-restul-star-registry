const expect = require('chai').expect;
const messageVerifier = require('./MessageVerifier.js');

const goodAddress = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ';
const goodTimestamp = 1532330740;
const goodSignature = 'IJtpSFiOJrw/xYeucFxsHvIRFJ85YSGP8S1AEZxM4/obS3xr9iz7H0ffD7aM2vugrRaCi/zxaPtkflNzt5ykbc0=';
describe ('Testing message verification', () =>{
    it('should return TRUE if the message is verified against the signature ', async() =>{
        let messageValidation = await messageVerifier.verifyMessageSignature(goodAddress, goodTimestamp, goodSignature);
        expect (messageValidation).to.be.true;
    });

    it('should return FALSE if tempered with signature ', async() =>{
        let invalidSignature = 'iJtpSFiOJrw/xYeucFxsHvIRFJ85YSGP8S1AEZxM4/obS3xr9iz7H0ffD7aM2vugrRaCi/zxaPtkflNzt5ykbc0='
        let messageValidation = await messageVerifier.verifyMessageSignature(goodAddress, goodTimestamp, invalidSignature);
        expect (messageValidation).to.be.false;
    });

    it('should return FALSE if tempered with address-inexistent ', async() =>{
        //invalid address
        let invalidAddress = '142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3Dpz';
        let messageValidation = await messageVerifier.verifyMessageSignature(invalidAddress, goodTimestamp, goodSignature);
        expect (messageValidation).to.be.false;
    });

    it('should return FALSE if tempered with address-different ', async() =>{
        //invalid address
        let invalidAddress = '14UtjbYhx7shNqXmHe1vAYaLjs9BDC6C4R';
        let messageValidation = await messageVerifier.verifyMessageSignature(invalidAddress, goodTimestamp, goodSignature);
        expect (messageValidation).to.be.false;
    });

    it('should return FALSE if tempered with timestamp ', async() =>{
        let invalidTimestamp = 1532330741;
        let messageValidation = await messageVerifier.verifyMessageSignature(goodAddress, invalidTimestamp, goodSignature);
        expect (messageValidation).to.be.false;
    });
});