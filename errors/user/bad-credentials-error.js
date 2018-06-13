const errorFactory = require('error-factory');

const AppError = require('../app-error');

const BadCredentialsError = errorFactory(
    'BadCredentialsError',
    {
        message: 'Bad credentials',
        status: 401,
    },
    AppError,
);

module.exports = BadCredentialsError;
