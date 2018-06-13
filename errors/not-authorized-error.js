const errorFactory = require('error-factory');

const AppError = require('./app-error');

const NotAuthorizedError = errorFactory(
    'NotAuthorizedError',
    {
        message: 'Not authorized',
        status: 403,
    },
    AppError,
);

module.exports = NotAuthorizedError;
