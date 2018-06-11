let errorFactory = require('error-factory');

let AppError = require('./app-error');

let NotAuthorizedError = errorFactory(
    'NotAuthorizedError',
    {
        message: 'Not authorized',
        status: 403,
    },
    AppError,
);

module.exports = NotAuthorizedError;
