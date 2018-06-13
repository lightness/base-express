const errorFactory = require('error-factory');

const AppError = require('../app-error');

const WrongMessageTargetError = errorFactory(
    'WrongMessageTargetError',
    {
        message: 'Wrong message target',
        status: 400,
    },
    AppError,
);

module.exports = WrongMessageTargetError;
