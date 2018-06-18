'use strict';
const errorFactory = require('error-factory');

const { AppError } = require('../app-error');

const FriendshipNotFoundError = errorFactory(
    'FriendshipNotFoundError',
    {
        message: 'Friendship not found',
        status: 404,
    },
    AppError,
);

module.exports = { FriendshipNotFoundError };
