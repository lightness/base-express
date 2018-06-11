let errorFactory = require('error-factory');

let AppError = require('../app-error');

let FriendshipNotFoundError = errorFactory(
    'FriendshipNotFoundError',
    {
        message: 'Friendship not found',
        status: 404,
    },
    AppError,
);

module.exports = FriendshipNotFoundError;
