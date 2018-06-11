let errorFactory = require('error-factory');

let AppError = require('../app-error');

let BadCredentialsError = errorFactory(
    'BadCredentialsError',
    {
        message: 'Bad credentials',
        status: 401,
    },
    AppError,
);

module.exports = BadCredentialsError;
