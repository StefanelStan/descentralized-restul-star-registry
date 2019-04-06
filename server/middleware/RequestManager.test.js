const expect = require('chai').expect;
const {RequestManager} = require('./RequestManager.js');

var requestManager;

beforeEach(() =>{
    requestManager = new RequestManager();
});

afterEach(() =>{
    requestManager.clearAllRequests();
});

describe('Testing RequestManager', () =>{
    it('should add a request into mempool and set a deletion event', () =>{
        let memPoolSize = requestManager.getSize();
        expect(memPoolSize).to.equal(0);

        let validationTimestamp = requestManager.addRequest('abc123');
        expect(parseInt(validationTimestamp)).to.be.above(10000000);
        memPoolSize = requestManager.getSize();
        expect(memPoolSize).to.equal(1);

        requestManager.addRequest('abc1234');
        memPoolSize = requestManager.getSize();
        expect(memPoolSize).to.equal(2);
    });

    it('should get a request from the mempool', () =>{
        let memPoolSize = requestManager.getSize();
        expect(memPoolSize).to.equal(0);

        requestManager.addRequest('abc123');
        memPoolSize = requestManager.getSize();
        expect(memPoolSize).to.equal(1);

        let time = new Date().getTime().toString().slice(0,-3);
        let requestTime = requestManager.getRequest('abc123');
        expect(requestTime).to.equal(time); 
    });

    it('should delete a request when asked to', ()=>{
        requestManager.addRequest('abc123');
        expect(requestManager.getSize()).to.equal(1);

        requestManager.addRequest('abc1234');

        requestManager.removeRequest('abc123');
        expect(requestManager.getSize()).to.equal(1);
    });

    it('should clear all requests when asked to', ()=>{
        requestManager.addRequest('abc123');
        requestManager.addRequest('abc124');
        requestManager.addRequest('abc125');
        requestManager.addRequest('abc126');
        expect(requestManager.getSize()).to.equal(4);

        requestManager.clearAllRequests();
        expect(requestManager.getSize()).to.equal(0);
    });

    it('should tell if a request is registered or not', () =>{
        requestManager.addRequest('abc123');

        expect(requestManager.isRequestRegistered('abc123')).to.be.true;
        expect(requestManager.isRequestRegistered('abce')).to.be.false;
    });
});