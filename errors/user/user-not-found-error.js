'use strict';
const errorFactory = require('error-factory');

const { AppError } = require('../app-error');

const UserNotFoundError = errorFactory(
    'UserNotFoundError',
    {
        message: 'User not found',
        status: 404,
    },
    AppError,
);

module.exports = { UserNotFoundError };
