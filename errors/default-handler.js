'use strict';
const { AppError } = require('./app-error');

function errorHandler(res) {
    return err => {
        if (err instanceof AppError) {
            res.status(err.status || 500).json({ message: err.message });
        } else {
            console.error(err);
            res.status(500).send({ message: 'Something went wrong' });
        }
    };
}

module.exports = { errorHandler };
