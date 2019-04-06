# RESTful web API using a Node.js framework
Fourth project for Blockchain NanoDegree that introduces web services to link with our private blockchain project and a Star Registry service that allows users to claim ownership of their favorite star in the night sky

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

### Prerequisites

* [NodeJS](https://nodejs.org/en/download/current/) (The install will also include the npm node package manager)
```
node -v
npm -v
```

### Installing

1. Save the project (P4_StefanelStan) and unzip it (new folder should be created P3)
2. Navigate into the project
```
cd P4
```
## Running the tests

This project has included series of tests: for the private blockchain, for database access objects, abstract logic handlers/managers and server/webservices. Their name is defined as *.test. 
(there might be the possibility for some of them to fail due to 3000ms response time. If any fails, run the command again)

```
npm test
```

## Deployment

The critical node_modules are not included to they will need to be installed first (npm might generate random error while installing them. Just try again in case this happens)

1. `cd P4` will move into project folder (if not already there)
2. `npm install` will install all the dependencies
3. `npm start` will start the server/application

## Endpoints

### Validation & Verification Endpoints

#### Endpoint Request Validation (POST)
```
http://localhost:8000/requestValidation
```
###### Parameters
```
{
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}
```
###### Returns
1. `400` if address is empty/null
2. `200` if another request has been done for the same address (and waiting for validation confirmation) with a reduced window time
2. `200` and a specific message to sign using the wallet
```
{
   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
   "requestTimeStamp": "1532296090",
   "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
   "validationWindow": 300
}
```

#### Endpoint Validate Signature (POST)
```
http://localhost:8000/message-signature/validate
```
###### Parameters
```
{
   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
   "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}
```
###### Returns
1. `400` if address or signature is empty/null
2. `403` if user is trying to validate signature without previously requestingValidation 
2. `200` and a specific message regarding the validation (successful or not)
```
{
   "registerStar": true,
   "status": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "requestTimeStamp": "1532296090",
      "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
      "validationWindow": 193,
      "messageSignature": "valid"
   }
}
```


### Star registration endpoints

#### Endpoint Register/Notarize a new star (POST)
```
http://localhost:8000/block
```
###### Parameters
```
{
   "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
   "star": {
      "dec": "-26° 29' 24.9",
      "ra": "16h 29m 1.0s",
      "story": "Found star using https://www.google.com/sky/"
  }
}
```
###### Returns
1. `500` if internal server error (eg: not being able to add a block in blockchain)
2. `403` if user is trying to register a star by skipping the registration and validation steps.
3. `400` if request has missing critical data (address, right_ascension, declination, story) or star_story has non-ASCII characters or size >500bytes
4. `200` and the freshly added block
```
{
   "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
   "height": 1,
   "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
         "ra": "16h 29m 1.0s",
         "dec": "-26° 29' 24.9",
         "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
      }
   },
   "time": "1532296234",
   "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```

### Star lookup endpoints

#### Endpoint Get block(star) by block height(GET)
```
http://localhost:8000/block/[HEIGHT]
```
###### Returns
1. `404` if block not found or if height is not specified
2. `200` and the found block
```
{
   "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
   "height": 1,
   "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
         "ra": "16h 29m 1.0s",
         "dec": "-26° 29' 24.9",
         "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
         "storyDecoded": "Found star using https://www.google.com/sky/"
      }
   },
   "time": "1532296234",
   "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```
#### Endpoint Get block(star) by block hash(GET)
```
"http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
```
###### Returns
1. `500` in case of major server error
2. `404` if block not found 
3. `400` if block hash is not specified/empty
2. `200` and the found block
```
{
   "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
   "height": 1,
   "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
         "ra": "16h 29m 1.0s",
         "dec": "-26° 29' 24.9",
         "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
         "storyDecoded": "Found star using https://www.google.com/sky/"
      }
   },
   "time": "1532296234",
   "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```
#### Endpoint Get block(star) by wallet address(GET)
```
http://localhost:8000/stars/address:[ADDRESS]
```
###### Returns
1. `500` in case of major server error
2. `404` if block not found or empty address 
2. `200` and the found list of blocks
```
[
   {
      "hash": "8b6ea54b077b7eabd669b23c6eb9338abec96a3b7a66b6c10ff7071f6106cbd7",
	  "height": 1,
      "body": {
         "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
         "star": {
            "dec": "-999999° 29 24.9",
            "ra": "16h 29m 1.0s",
            "story": "537461723120466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Star1 Found star using https://www.google.com/sky/"
         }
      },
      "time": "1540755139",
      "previousblockhash": "dc524bf259276cefffeeee835d4b6b225b7a4a875006da55c565c863f94da6e6"
   },
   {
      "hash": "bbee01afc9b345f25512a0589e496b94f547072d2f86b9ccef2935eb60034554",
      "height": 2,
      "body": {
         "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
         "star": {
            "dec": "-999999° 29 24.9",
            "ra": "16h 29m 1.0s",
            "story": "537461723220466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Star2 Found star using https://www.google.com/sky/"
         }
      },
      "time": "1540758483",
      "previousblockhash": "8b6ea54b077b7eabd669b23c6eb9338abec96a3b7a66b6c10ff7071f6106cbd7"
   },
   {
      "hash": "e76c80d504070d46cf8d35e4575284beb30952ee8e0541b729a975d96e4fd0b7",
      "height": 3,
      "body": {
         "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
         "star": {
            "dec": "-999999° 29 24.9",
            "ra": "16h 29m 1.0s",
            "story": "537461723320466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Star3 Found star using https://www.google.com/sky/"
         }
      },
      "time": "1540758583",
      "previousblockhash": "bbee01afc9b345f25512a0589e496b94f547072d2f86b9ccef2935eb60034554"
   }
]
```



## Architecture
Local server
- Node.js (v10+)
- Express.js
- Level (DB engine)

Testing done with `chai, mocha, sinon and supertest`,  message validation using `bitcoinjs-message` and SHA256 with `crypto-js`. Character validation done using `validator`.

## Built With

* [Visual Studio Code](https://code.visualstudio.com/) - Web editor
* [Postman](https://www.getpostman.com/) - Web API testing

## Authors

* **Stefanel Stan** - *Initial work* - [Stefanel Stan Github](https://github.com/StefanelStan)

## License

This project is licensed under the MIT License 
