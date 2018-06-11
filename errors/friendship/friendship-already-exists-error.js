let errorFactory = require('error-factory');

let AppError = require('../app-error');

let FriendshipAlreadyExistsError = errorFactory(
    'FriendshipAlreadyExistsError',
    {
        message: 'Friendship already exists',
        status: 400,
    },
    AppError,
);

module.exports = FriendshipAlreadyExistsError;
