const jsonwebtoken = require('jsonwebtoken');

module.exports = {
    secret: 'SECREt42',
    createJwt: function(userId) {
        return jsonwebtoken.sign({ userId: userId }, this.secret);
    },
    createAuthHeader: function(userId) {
        return 'Bearer ' + this.createJwt(userId);
    },
};
