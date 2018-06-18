module.exports = {
    ...require('./friendship'),
    ...require('./message'),
    ...require('./user'),
    ...require('./app-error'),
    ...require('./default-handler'),
    ...require('./not-authorized-error'),
    ...require('./validation-error'),
};
