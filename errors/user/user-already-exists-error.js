'use strict';
const errorFactory = require('error-factory');

const AppError = require('../app-error');

const UserAlreadyExistsError = errorFactory(
    'UserAlreadyExistsError',
    {
        message: 'User with such email already exists',
        status: 400,
    },
    AppError,
);

module.exports = UserAlreadyExistsError;
