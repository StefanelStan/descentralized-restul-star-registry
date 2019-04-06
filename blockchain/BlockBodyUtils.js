var buildEncodedBlockBody = (address, ra, dec, readableStory) =>{
    return {
        address,
        star: {
            ra,
            dec,
            story: Buffer.from(readableStory, 'utf8').toString('hex'),
        }
    }
};

var buildEncodedStoryBlockBody = (body) => {
    let encodedStory = Buffer.from(body.star.story, 'utf8').toString('hex');
    body.star.story = encodedStory;
};

var buildDecodedStoryBlockBody = (body) => {
    body.star.storyDecoded = Buffer.from(body.star.story, 'hex').toString();
};

module.exports = {
    buildEncodedBlockBody,
    buildEncodedStoryBlockBody,
    buildDecodedStoryBlockBody
}