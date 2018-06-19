'use strict';
const jwtHelper = require('../../helpers/jwt');
const mockFactory = require('../helpers/mock-factory');
const { User } = require('../../models');

function setupCurrentUserCreation() {
    let currentUser;
    let authorizationHeader;

    beforeEach(done => {
        User.create(mockFactory.create('user', { omit: ['id'] }))
            .then(createdUser => {
                currentUser = createdUser.toJSON();
                authorizationHeader = jwtHelper.createAuthHeader(createdUser.id);
            })
            .catch(fail)
            .finally(done);
    });

    return {
        getCurrentUser: () => currentUser,
        getAuthorizationHeader: () => authorizationHeader,
    };
}

module.exports = setupCurrentUserCreation;
