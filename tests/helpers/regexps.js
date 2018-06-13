const AuthHeader = /^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+=]*$/;

module.exports = {
    AuthHeaderRegexp: AuthHeader,
};
