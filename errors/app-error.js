let errorFactory = require('error-factory');

let AppError = errorFactory('AppError', {
    message: 'Something went wrong',
});

module.exports = AppError;
