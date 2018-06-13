const AppError = require('./app-error');

module.exports = function(res) {
    return function(err) {
        if (err instanceof AppError) {
            res.status(err.status || 500).send(err.message);
        } else {
            console.error(err);
            res.status(500).send('Something went wrong');
        }
    };
};
