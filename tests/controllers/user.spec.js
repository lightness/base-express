const _ = require('lodash');
const request = require('supertest');

const app = require('../../app');
const db = require('../../models');
const jwtHelper = require('../../helpers/jwt');
const mockFactory = require('../helpers/mock-factory');
const { ContentType, Header, Accept } = require('../helpers/enums');

describe('User controller', function() {
    let now;

    beforeEach(function(done) {
        now = new Date();

        jasmine.clock().install();
        jasmine.clock().mockDate(now);

        db.sequelize.sync({ force: true }).then(done);
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    describe('GET /user/me', function() {
        const URL = '/user/me';

        it('should respond with 401, if authorization token is not set', function(done) {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(function(res) {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 401, if authorization token is malformed', function(done) {
            const MALFORMED_HEADER = 'Bearer XXX';
            const EXPECTED_ERROR_MESSAGE = 'jwt malformed';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, MALFORMED_HEADER)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(function(res) {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if authorization token contains wrong user id', function(done) {
            const EXPECTED_ERROR_MESSAGE = 'User not found';
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            db.User.create(userToCreate).then(function(createdUser) {
                const authHeader = jwtHelper.createAuthHeader(
                    createdUser.id + 1,
                );

                request(app)
                    .get(URL)
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(function(res) {
                        expect(res.body).toBeDefined();
                        expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                    })
                    .expect(404, done);
            });
        });

        it('should respond with 200, if authorization token is correct', function(done) {
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            db.User.create(userToCreate).then(function(createdUser) {
                const authHeader = jwtHelper.createAuthHeader(createdUser.id);

                request(app)
                    .get(URL)
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(function(res) {
                        expect(res.body).toBeDefined();
                        expect(res.body.id).toBe(createdUser.id);
                        expect(res.body.email).toBe(createdUser.email);
                        expect(res.body.fullName).toBe(createdUser.fullName);
                        expect(res.body.password).toBeUndefined();
                        expect(new Date(res.body.createdAt)).toEqual(now);
                        expect(new Date(res.body.updatedAt)).toEqual(now);
                    })
                    .expect(200, done);
            });
        });
    });

    describe('GET /user/:id', function() {
        it('should respond with 401, if authorization token is not set', function(done) {
            const URL = '/user/1';
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(function(res) {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if no user with such id', function(done) {
            const URL = '/user/5';
            const EXPECTED_ERROR_MESSAGE = 'User not found';

            const authHeader = jwtHelper.createAuthHeader(1);

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(function(res) {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(404, done);
        });
    });
});
