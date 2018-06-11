let errorFactory = require('error-factory');

let AppError = require('../app-error');

let UserAlreadyExistsError = errorFactory(
    'UserAlreadyExistsError',
    {
        message: 'User with such email already exists',
        status: 400,
    },
    AppError,
);

module.exports = UserAlreadyExistsError;
