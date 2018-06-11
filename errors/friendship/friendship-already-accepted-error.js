let errorFactory = require('error-factory');

let AppError = require('../app-error');

let FriendshipAlreadyAcceptedError = errorFactory(
    'FriendshipAlreadyAcceptedError',
    {
        message: 'Friendship already accepted',
        status: 400,
    },
    AppError,
);

module.exports = FriendshipAlreadyAcceptedError;
