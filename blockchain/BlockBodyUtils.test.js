const expect = require('chai').expect;

const blockUtils = require('./BlockBodyUtils.js');

describe('Testing Block Body Utils', () => {
    decodedStory = 'Found star using https://www.google.com/sky/';
    encodedStory = '466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f';
    it('should build and encoded story from a human readable story', () => {
        let blockBody = {
            address: "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            star: {
                dec: "-26° 29' 24.9",
                ra: "16h 29m 1.0s",
                story: decodedStory
            }
        };

        blockUtils.buildEncodedStoryBlockBody(blockBody);
        expect(blockBody.star.story).to.deep.equal(encodedStory);
    });


    it('should append a storyDecoded attribute to an encoded story raw block', () => {
        let blockBody = {
            address: "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            star: {
                dec: "-26° 29' 24.9",
                ra: "16h 29m 1.0s",
                story: encodedStory
            }
        };
        blockUtils.buildDecodedStoryBlockBody(blockBody);
        expect(blockBody.star.storyDecoded).to.deep.equal(decodedStory);
    });
});