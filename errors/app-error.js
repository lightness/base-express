'use strict';
const errorFactory = require('error-factory');

const AppError = errorFactory('AppError', {
    message: 'Something went wrong',
});

module.exports = { AppError };
