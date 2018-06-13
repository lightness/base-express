const errorFactory = require('error-factory');

const AppError = require('../app-error');

const MessageRangeError = errorFactory(
    'MessageRangeError',
    {
        message: 'Message range error',
        status: 400,
    },
    AppError,
);

module.exports = MessageRangeError;
