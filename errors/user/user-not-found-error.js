let errorFactory = require('error-factory');

let AppError = require('../app-error');

let UserNotFoundError = errorFactory(
    'UserNotFoundError',
    {
        message: 'User not found',
        status: 404,
    },
    AppError,
);

module.exports = UserNotFoundError;
