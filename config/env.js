const _ = require('lodash');

const Env = Object.freeze({
    DEV: 'development',
    TEST: 'test',
    PROD: 'production',
});

function getEnv() {
    const actualEnv = process.env.NODE_ENV;
    const isEnvCorrect = _(Env)
        .values()
        .includes(actualEnv);

    return isEnvCorrect ? actualEnv : Env.DEV;
}

module.exports = {
    Env: Env,
    getEnv: getEnv,
};
