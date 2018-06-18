'use strict';
const errorFactory = require('error-factory');

const { AppError } = require('../app-error');

const WrongFriendshipTargetError = errorFactory(
    'WrongFriendshipTargetError',
    {
        message: 'Wrong friendship target',
        status: 400,
    },
    AppError,
);

module.exports = { WrongFriendshipTargetError };
