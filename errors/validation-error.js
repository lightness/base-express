'use strict';
const errorFactory = require('error-factory');

const { AppError } = require('./app-error');

const ValidationError = errorFactory(
    'ValidationError',
    {
        message: 'Validation error',
        status: 400,
    },
    AppError,
);

module.exports = { ValidationError };
