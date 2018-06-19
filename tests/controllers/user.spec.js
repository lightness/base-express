'use strict';
const _ = require('lodash');
const request = require('supertest');
const Promise = require('bluebird');

const app = require('../../app');
const jwtHelper = require('../../helpers/jwt');
const mockFactory = require('../helpers/mock-factory');
const freezeDate = require('../helpers/date-holder');
const setupDataRepopulation = require('../helpers/data-repopulator');
const setupCurrentUserCreation = require('../helpers/current-user-holder');
const { User } = require('../../models');
const { AuthHeaderRegexp } = require('../helpers/regexps');
const { ContentType, Header, Accept } = require('../helpers/enums');

describe('User controller', () => {
    setupDataRepopulation();
    let dateHolder = freezeDate();
    let currentUserHolder = setupCurrentUserCreation();

    describe('GET /user/me', () => {
        const URL = '/user/me';

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 401, if authorization token is malformed', done => {
            const MALFORMED_HEADER = 'Bearer XXX';
            const EXPECTED_ERROR_MESSAGE = 'jwt malformed';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, MALFORMED_HEADER)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if authorization token contains wrong user id', done => {
            const EXPECTED_ERROR_MESSAGE = 'User not found';
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            User.create(userToCreate)
                .then(createdUser => {
                    const authHeader = jwtHelper.createAuthHeader(createdUser.id + 1);

                    return new Promise(resolve => {
                        request(app)
                            .get(URL)
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, authHeader)
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                            })
                            .expect(404, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 200, if authorization token is correct', done => {
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            User.create(userToCreate)
                .then(createdUser => {
                    const authHeader = jwtHelper.createAuthHeader(createdUser.id);

                    return new Promise(resolve => {
                        request(app)
                            .get(URL)
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, authHeader)
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body.id).toBe(createdUser.id);
                                expect(res.body.email).toBe(createdUser.email);
                                expect(res.body.fullName).toBe(createdUser.fullName);
                                expect(res.body.password).toBeUndefined();
                                expect(new Date(res.body.createdAt)).toEqual(dateHolder.getNow());
                                expect(new Date(res.body.updatedAt)).toEqual(dateHolder.getNow());
                            })
                            .expect(200, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });
    });

    describe('GET /user/:id', () => {
        it('should respond with 401, if authorization token is not set', done => {
            const URL = '/user/1';
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if no user with such id', done => {
            const URL = '/user/5';
            const EXPECTED_ERROR_MESSAGE = 'User not found';

            request(app)
                .get(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, currentUserHolder.getAuthorizationHeader())
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(404, done);
        });

        it('should respond with 200, if user found', done => {
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            User.create(userToCreate)
                .then(createdUser => {
                    const URL = '/user/' + createdUser.id;

                    return new Promise(resolve => {
                        request(app)
                            .get(URL)
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, currentUserHolder.getAuthorizationHeader())
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body.id).toBe(createdUser.id);
                                expect(res.body.email).toBe(createdUser.email);
                                expect(res.body.fullName).toBe(createdUser.fullName);
                                expect(res.body.password).toBeUndefined();
                                expect(new Date(res.body.createdAt)).toEqual(dateHolder.getNow());
                                expect(new Date(res.body.updatedAt)).toEqual(dateHolder.getNow());
                            })
                            .expect(200, done);
                    });
                })
                .catch(fail)
                .finally(done);
        });
    });

    describe('POST /user/login', () => {
        const URL = '/user/login';

        it('should respond with 200 and contain authorization header, if login was successful', done => {
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            User.create(userToCreate)
                .then(createdUser => {
                    const email = createdUser.email;
                    const password = 'any password';

                    spyOn(require('bcryptjs'), 'compare').and.callFake(() => Promise.resolve(true));

                    return new Promise(resolve => {
                        request(app)
                            .post(URL)
                            .send({
                                email: email,
                                password: password,
                            })
                            .set(Header.ACCEPT, Accept.JSON)
                            .expect(Header.AUTHORIZATION, AuthHeaderRegexp)
                            .expect(200, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 401, if wrong email was passed', done => {
            const email = 'wrong@email.com';
            const password = 'any password';

            request(app)
                .post(URL)
                .send({
                    email: email,
                    password: password,
                })
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.headers).toBeDefined();
                    expect(res.headers.authorization).not.toBeDefined();
                })
                .expect(401, done);
        });

        it('should respond with 401, if wrong password was passed', done => {
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            User.create(userToCreate)
                .then(createdUser => {
                    const email = createdUser.email;
                    const password = 'any password';

                    spyOn(require('bcryptjs'), 'compare').and.callFake(() => Promise.resolve(false));

                    return new Promise(resolve => {
                        request(app)
                            .post(URL)
                            .send({
                                email: email,
                                password: password,
                            })
                            .set(Header.ACCEPT, Accept.JSON)
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.headers).toBeDefined();
                                expect(res.headers.authorization).not.toBeDefined();
                            })
                            .expect(401, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });
    });

    describe('POST /user/register', () => {
        const URL = '/user/register';

        it('should respond with 400, if user with such email already exists', done => {
            const EXPECTED_ERROR_MESSAGE = 'User with such email already exists';
            const userToCreate = mockFactory.create('user', { omit: ['id'] });

            User.create(userToCreate)
                .then(() => {
                    return new Promise(resolve => {
                        request(app)
                            .post(URL)
                            .send(userToCreate)
                            .set(Header.ACCEPT, Accept.JSON)
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                            })
                            .expect(400, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 400, if no email specified', done => {
            const EXPECTED_ERROR_MESSAGE = '"email" is required';
            const userToRegister = mockFactory.create('user', {
                omit: ['id', 'email'],
            });

            request(app)
                .post(URL)
                .send(userToRegister)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 400, if email has wrong format', done => {
            const EXPECTED_ERROR_MESSAGE = '"email" must be a valid email';
            const userToRegister = mockFactory.create('user', {
                omit: ['id'],
                defaults: {
                    email: 'wrong format',
                },
            });

            request(app)
                .post(URL)
                .send(userToRegister)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 400, if no full name specified', done => {
            const EXPECTED_ERROR_MESSAGE = '"fullName" is required';
            const userToRegister = mockFactory.create('user', {
                omit: ['id', 'fullName'],
            });

            request(app)
                .post(URL)
                .send(userToRegister)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 400, if no password specified', done => {
            const EXPECTED_ERROR_MESSAGE = '"password" is required';
            const userToRegister = mockFactory.create('user', {
                omit: ['id', 'password'],
            });

            request(app)
                .post(URL)
                .send(userToRegister)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 400, if password is too short', done => {
            const EXPECTED_ERROR_MESSAGE = '"password" length must be at least 8 characters long';
            const userToRegister = mockFactory.create('user', {
                omit: ['id'],
                defaults: {
                    password: 'short',
                },
            });

            request(app)
                .post(URL)
                .send(userToRegister)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 200, if no user with such email', done => {
            const userToRegister = mockFactory.create('user', { omit: ['id'] });

            request(app)
                .post(URL)
                .send(userToRegister)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.id).toEqual(jasmine.any(Number));
                    expect(res.body.fullName).toBe(userToRegister.fullName);
                    expect(res.body.email).toBe(userToRegister.email);
                    expect(res.body.password).not.toBeDefined();
                    expect(new Date(res.body.createdAt)).toEqual(dateHolder.getNow());
                    expect(new Date(res.body.updatedAt)).toEqual(dateHolder.getNow());
                })
                .expect(200, done);
        });

        it('should persist user, if no user with such email', done => {
            const userToRegister = mockFactory.create('user', { omit: ['id'] });

            new Promise(resolve => {
                let createdUserId;

                request(app)
                    .post(URL)
                    .send(userToRegister)
                    .set(Header.ACCEPT, Accept.JSON)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(res => {
                        createdUserId = res.body.id;
                    })
                    .end(() => {
                        resolve(createdUserId);
                    });
            })
                .then(createdUserId => User.findById(createdUserId))
                .then(foundUser => {
                    expect(foundUser).toBeDefined();
                })
                .catch(fail)
                .finally(done);
        });
    });

    describe('GET /user?q', () => {
        const URL = '/user';

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            const userToRegister = mockFactory.create('user', { omit: ['id'] });
            const partOfEmail = userToRegister.email.slice(1, -1);

            User.create(userToRegister)
                .then(() => {
                    return new Promise(resolve => {
                        request(app)
                            .get(URL + '?q=' + encodeURIComponent(partOfEmail))
                            .set(Header.ACCEPT, Accept.JSON)
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                            })
                            .expect(401, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 200 and return list of users, if email contains query token', done => {
            const userToRegister = mockFactory.create('user', { omit: ['id'] });
            const partOfEmail = userToRegister.email.slice(1, -1);

            User.create(userToRegister)
                .then(createdUser => {
                    return new Promise(resolve => {
                        request(app)
                            .get(URL + '?q=' + encodeURIComponent(partOfEmail))
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, currentUserHolder.getAuthorizationHeader())
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body).toEqual(jasmine.any(Array));
                                expect(res.body.length).toBe(1);
                                expect(res.body[0]).toBeDefined();
                                expect(res.body[0].id).toBe(createdUser.id);
                                expect(res.body[0].email).toBe(userToRegister.email);
                                expect(res.body[0].fullName).toBe(userToRegister.fullName);
                                expect(res.body[0].password).not.toBeDefined();
                            })
                            .expect(200, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 200 and return list of users, if full name contains query token', done => {
            const userToRegister = mockFactory.create('user', { omit: ['id'] });
            const partOfFullName = userToRegister.fullName.slice(1, -1);

            User.create(userToRegister)
                .then(createdUser => {
                    return new Promise(resolve => {
                        request(app)
                            .get(URL + '?q=' + encodeURIComponent(partOfFullName))
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, currentUserHolder.getAuthorizationHeader())
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body).toEqual(jasmine.any(Array));
                                expect(res.body.length).toBe(1);
                                expect(res.body[0]).toBeDefined();
                                expect(res.body[0].id).toBe(createdUser.id);
                                expect(res.body[0].email).toBe(userToRegister.email);
                                expect(res.body[0].fullName).toBe(userToRegister.fullName);
                                expect(res.body[0].password).not.toBeDefined();
                            })
                            .expect(200, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 200 and return empty list, if no matches', done => {
            const userToRegister = mockFactory.create('user', { omit: ['id'] });
            const partOfFullName = userToRegister.fullName.slice(1, -1);
            const query = partOfFullName + partOfFullName;

            User.create(userToRegister)
                .then(() => {
                    return new Promise(resolve => {
                        request(app)
                            .get(URL + '?q=' + encodeURIComponent(query))
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, currentUserHolder.getAuthorizationHeader())
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(res => {
                                expect(res.body).toBeDefined();
                                expect(res.body).toEqual(jasmine.any(Array));
                                expect(res.body.length).toBe(0);
                            })
                            .expect(200, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should respond with 200 and do not return current user, if matches query', done => {
            request(app)
                .get(URL + '?q=' + encodeURIComponent(currentUserHolder.getCurrentUser().email))
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, currentUserHolder.getAuthorizationHeader())
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body).toEqual(jasmine.any(Array));
                    expect(res.body.length).toBe(0);
                })
                .expect(200, done);
        });
    });
});
