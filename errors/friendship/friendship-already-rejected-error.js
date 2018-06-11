let errorFactory = require('error-factory');

let AppError = require('../app-error');

let FriendshipAlreadyRejectedError = errorFactory(
    'FriendshipAlreadyRejectedError',
    {
        message: 'Friendship already rejected',
        status: 400,
    },
    AppError,
);

module.exports = FriendshipAlreadyRejectedError;
