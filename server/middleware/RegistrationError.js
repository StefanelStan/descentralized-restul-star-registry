class RegistrationError extends Error {
    constructor(message) {
        super(message);
        this.name = "RegistrationError";
    }
}

module.exports = {
    RegistrationError
}