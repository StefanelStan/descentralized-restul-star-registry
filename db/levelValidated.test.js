const expect = require('chai').expect;

var db = require('./levelValidated.js');

beforeEach(async () => {
    await db.deleteAllAddresses();
    return;
});

afterEach(async () =>{
    await db.deleteAllAddresses();
    return;
});

describe('Testing LevelValidated', () => {
    it('should add a recording to the recording validation database and get correct size', async () => {
        await db.saveAddress('abc', JSON.stringify(120));
        let size = await db.getSize();
        expect(size).to.equal(1);

        await db.saveAddress('abcd', JSON.stringify(120));
        size = await db.getSize();
        expect(size).to.equal(2);
    });

    it('should get the registered address from db if exists or not', async() =>{
        await db.saveAddress('abc', JSON.stringify(120));
        let recording = await db.getAddress('abc');
        expect(parseInt(recording)).to.equal(120);

        let inexistentRecording = await db.getAddress('xyz');
        expect(inexistentRecording).to.be.null;
    });
});