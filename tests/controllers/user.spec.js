const _ = require('lodash');
const request = require('supertest');

const app = require('../../app');
const db = require('../../models');
const jwtHelper = require('../../helpers/jwt');

const ContentType = Object.freeze({
    HTML: /text\/html/,
    JSON: /application\/json/,
});

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
        it('should respond with 401, if authorization token is not set', function(done) {
            request(app)
                .get('/user/me')
                .set('Accept', 'application/json')
                .expect('Content-Type', ContentType.JSON)
                .expect(function(res) {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe('No authorization token was found');
                })
                .expect(401, done);
        });

        it('should respond with 401, if authorization token is malformed', function(done) {
            request(app)
                .get('/user/me')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer XXX')
                .expect('Content-Type', ContentType.JSON)
                .expect(function(res) {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe('jwt malformed');
                })
                .expect(401, done);
        });

        it('should respond with 404, if authorization token contains wrong user id', function(done) {
            const userToCreate = {
                email: 'test@test.com',
                fullName: 'Test User',
                password: 'Some password',
            };

            db.User.create(userToCreate).then(function(createdUser) {
                const jwt = jwtHelper.createJwt(createdUser.id + 1);
                const header = 'Bearer ' + jwt;

                request(app)
                    .get('/user/me')
                    .set('Accept', 'application/json')
                    .set('Authorization', header)
                    .expect('Content-Type', ContentType.JSON)
                    .expect(function(res) {
                        expect(res.body).toBeDefined();
                        expect(res.body.message).toBe('User not found');
                    })
                    .expect(404, done);
            });
        });

        it('should respond with 200, if authorization token is correct', function(done) {
            const userToCreate = {
                email: 'test@test.com',
                fullName: 'Test User',
                password: 'Some password',
            };

            db.User.create(userToCreate).then(function(createdUser) {
                const jwt = jwtHelper.createJwt(createdUser.id);
                const header = 'Bearer ' + jwt;

                request(app)
                    .get('/user/me')
                    .set('Accept', 'application/json')
                    .set('Authorization', header)
                    .expect('Content-Type', ContentType.JSON)
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
});
