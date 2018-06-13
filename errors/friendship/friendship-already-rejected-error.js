const errorFactory = require('error-factory');

const AppError = require('../app-error');

const FriendshipAlreadyRejectedError = errorFactory(
    'FriendshipAlreadyRejectedError',
    {
        message: 'Friendship already rejected',
        status: 400,
    },
    AppError,
);

module.exports = FriendshipAlreadyRejectedError;
