const _ = require('lodash');
const request = require('supertest');

const app = require('../../app');
const db = require('../../models');
const jwtHelper = require('../../helpers/jwt');
const mockFactory = require('../helpers/mock-factory');
const { AuthHeaderRegexp } = require('../helpers/regexps');
const { ContentType, Header, Accept } = require('../helpers/enums');

describe('Friendship controller', () => {
    let now;
    let currentUser;
    let authorizationHeader;

    beforeEach(done => {
        now = new Date();

        jasmine.clock().install();
        jasmine.clock().mockDate(now);

        sequelize
            .sync({ force: true })
            .then(() =>
                User.create(mockFactory.create('user', { omit: ['id'] })),
            )
            .then(createdUser => {
                currentUser = createdUser.toJSON();
                authorizationHeader = jwtHelper.createAuthHeader(
                    createdUser.id,
                );
            })
            .then(done);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    describe('GET /friendship/friends', () => {
        const URL = '/friendship/friends';

        it('should respond with 401, if authorization token is not set');
        it('should respond with 200 and return list of accepted outgoing friendship requests');
        it('should respond with 200 and return list of accepted incoming friendship requests');
    });

    describe('GET /friendship/requests', () => {
        const URL = '/friendship/requests';

        it('should respond with 401, if authorization token is not set');
        it('should respond with 200 and return list of rejected outgoing friendship requests');
        it('should respond with 200 and return list of pending outgoing friendship requests');
        it('should respond with 200 and return list of rejected incoming friendship requests');
        it('should respond with 200 and return list of pending incoming friendship requests');
    });

    describe('POST /friendship/request', () => {
        const URL = '/friendship/request';

        it('should respond with 401, if authorization token is not set');
        it('should respond with 400, if user try to request friendship with itself');
        it('should respond with 404, if target user is not found');
        it('should respond with 400, if incoming friendship already exists');
        it('should respond with 400, if outgoing friendship already exists');
        it('should respond with 200 and return created friendship request, if all conditions passed');
        it('should persist friendship request to database, if all conditions passed');
    });

    describe('PUT /friendship/:id/accept', () => {
        const getUrl = (id) => `/friendship/${id}/accept`;

        it('should respond with 401, if authorization token is not set');
        it('should respond with 404, if friendship is not found');
        it('should respond with 404, if friendship refers to another user');
        it('should respond with 400, if friendship is already accepted');
        it('should respond with 400, if friendship is already rejected');
        it('should respond with 200 and return accepted friendship request, if all conditions passed');
        it('should persist accepted friendship to database, if all conditions passed');
    });

    describe('PUT /friendship/:id/reject', () => {
        const getUrl = (id) => `/friendship/${id}/reject`;

        it('should respond with 401, if authorization token is not set');
        it('should respond with 404, if friendship is not found');
        it('should respond with 404, if friendship refers to another user');
        it('should respond with 400, if friendship is already accepted');
        it('should respond with 400, if friendship is already rejected');
        it('should respond with 200 and return rejected friendship request, if all conditions passed');
        it('should persist rejected friendship to database, if all conditions passed');
    });

    describe('DELETE /friendship/:id', () => {
        const getUrl = (id) => `/friendship/${id}`;

        it('should respond with 401, if authorization token is not set');
        it('should respond with 404, if friendship is not found');
        it('should respond with 404, if friendship refers to another users');
        it('should respond with 200, if all conditions passed');
        it('should destroy friendship, if all conditions passed');
    });

});
