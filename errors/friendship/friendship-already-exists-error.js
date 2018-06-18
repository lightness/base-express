'use strict';
const errorFactory = require('error-factory');

const { AppError } = require('../app-error');

const FriendshipAlreadyExistsError = errorFactory(
    'FriendshipAlreadyExistsError',
    {
        message: 'Friendship already exists',
        status: 400,
    },
    AppError,
);

module.exports = { FriendshipAlreadyExistsError };
