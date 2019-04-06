class RequestManager{
    constructor(){
        this.requests = new Map();
        this.toDelete = new Map();
    }

    addRequest(address){
        if (this.requests.get(address) == undefined){
            let date = new Date().getTime().toString().slice(0,-3);
            this.requests.set(address, date);
            this.createDeletionEvent(address);
            return date;
        }
        else {
            throw new Error('Address has already requested a validation!');
        }
    }

    removeRequest(address){
        this.requests.delete(address);
        clearTimeout(this.toDelete.get(address));
        this.toDelete.delete(address);
    }

    getRequest(address){
        return this.requests.get(address);
    }

    isRequestRegistered(address){
        let request = this.getRequest(address);
        if (request == null || request == undefined){
            return false;
        }
        return true;
    }

    createDeletionEvent(address) {
        this.toDelete.set(address, setTimeout(() => {
            this.requests.delete(address);
        }, 300000));
    }

    clearAllRequests(){
        for(let value of this.toDelete.values()){
            clearTimeout(value);
        }
        this.requests.clear();
        this.toDelete.clear();
    }

    getSize(){
        let requestSize =  this.requests.size;
        let toDeleteSize = this.toDelete.size;
        if (requestSize != toDeleteSize){
            throw new Error('Error while managing the mempool')
        }
        else {
            return requestSize;
        }
    }
}

module.exports = {
    RequestManager
}