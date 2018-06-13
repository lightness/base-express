const _ = require('lodash');
const request = require('supertest');

const app = require('../../app');
const db = require('../../models');
const jwtHelper = require('../../helpers/jwt');

const ContentType = Object.freeze({
    HTML: /text\/html/,
    JSON: /application\/json/,
});

describe('GET /user/me', function() {
    let now;

    beforeEach(function(done) {
        now = new Date();

        jasmine.clock().install();
        jasmine.clock().mockDate(now);

        db.sequelize.sync({ force: true }).then(done);
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    })

    it('should respond with 401, if authorization token is not set', function(done) {
        request(app)
            .get('/user/me')
            .set('Accept', 'application/json')
            .expect('Content-Type', ContentType.HTML)
            .expect(401, /No authorization token was found/, done);
    });

    it('should respond with 200, if authorization token is set', function(done) {
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
