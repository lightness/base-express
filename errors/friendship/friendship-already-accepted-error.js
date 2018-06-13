const errorFactory = require('error-factory');

const AppError = require('../app-error');

const FriendshipAlreadyAcceptedError = errorFactory(
    'FriendshipAlreadyAcceptedError',
    {
        message: 'Friendship already accepted',
        status: 400,
    },
    AppError,
);

module.exports = FriendshipAlreadyAcceptedError;
