'use strict';
const _ = require('lodash');
const request = require('supertest');
const Promise = require('bluebird');
const { Op } = require('sequelize');

const app = require('../../app');
const sequelize = require('../../models/sequelize');
const jwtHelper = require('../../helpers/jwt');
const mockFactory = require('../helpers/mock-factory');
const expectations = require('../helpers/common-expectations');
const { User, Message } = require('../../models');
const { ContentType, Header, Accept } = require('../helpers/enums');

describe('Message controller', () => {
    let now;
    let currentUser;
    let authorizationHeader;

    beforeEach(done => {
        now = new Date();

        jasmine.clock().install();
        jasmine.clock().mockDate(now);

        sequelize
            .sync({ force: true })
            .then(() => User.create(mockFactory.create('user', { omit: ['id'] })))
            .then(createdUser => {
                currentUser = createdUser.toJSON();
                authorizationHeader = jwtHelper.createAuthHeader(createdUser.id);
            })
            .then(done);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    describe('POST /message/send', () => {
        const URL = '/message/send';
        let publishSpy;

        beforeEach(() => {
            publishSpy = spyOn(require('../../long-poll'), 'publish').and.callFake(_.noop);
        });

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .post(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 400, if user tries to send message itself', done => {
            const EXPECTED_ERROR_MESSAGE = 'You can not send a message to yourself';
            const message = mockFactory.create('message', {
                omit: ['id', 'isRead', 'fromUserId'],
                defaults: {
                    toUserId: currentUser.id,
                },
            });

            request(app)
                .post(URL)
                .send(message)
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authorizationHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 400, if target user id is wrong', done => {
            const EXPECTED_ERROR_MESSAGE = 'Wrong target user id specified';
            const WRONG_TARGET_USER_ID = -1;

            request(app)
                .post(URL)
                .send({ toUserId: WRONG_TARGET_USER_ID })
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authorizationHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 200 and return created message, if all conditions passed', done => {
            const targetUser = mockFactory.create('user', {
                omit: ['id'],
            });

            User.create(targetUser).then(createdTargetUser => {
                const message = mockFactory.create('message', {
                    omit: ['id', 'isRead', 'fromUserId'],
                    defaults: {
                        toUserId: createdTargetUser.id,
                    },
                });

                request(app)
                    .post(URL)
                    .send(message)
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authorizationHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(res => {
                        expectations.expectMessagesAreEqual(res.body, {
                            ...message,
                            isRead: false,
                            fromUserId: currentUser.id,
                        });
                    })
                    .expect(200, done);
            });
        });

        it('should persist message, if all conditions passed', done => {
            const targetUser = mockFactory.create('user', {
                omit: ['id'],
            });

            User.create(targetUser).then(createdTargetUser => {
                const message = mockFactory.create('message', {
                    omit: ['id', 'isRead', 'fromUserId'],
                    defaults: {
                        toUserId: createdTargetUser.id,
                    },
                });

                let createdMessageId;

                request(app)
                    .post(URL)
                    .send(message)
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authorizationHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(res => {
                        createdMessageId = res.body.id;
                    })
                    .end(() => {
                        Message.findById(createdMessageId)
                            .then(foundMessage => {
                                expectations.expectMessagesAreEqual(foundMessage, {
                                    ...message,
                                    fromUserId: currentUser.id,
                                    isRead: false,
                                });
                            })
                            .finally(done);
                    });
            });
        });

        it('should publish message through long polling, if all conditions passed', done => {
            const targetUser = mockFactory.create('user', {
                omit: ['id'],
            });

            User.create(targetUser).then(createdTargetUser => {
                const message = mockFactory.create('message', {
                    omit: ['id', 'isRead', 'fromUserId'],
                    defaults: {
                        toUserId: createdTargetUser.id,
                    },
                });

                request(app)
                    .post(URL)
                    .send(message)
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authorizationHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(() => {
                        expect(publishSpy).toHaveBeenCalledTimes(1);
                        expect(publishSpy).toHaveBeenCalledWith(
                            createdTargetUser.id,
                            jasmine.objectContaining({
                                id: jasmine.any(Number),
                                fromUserId: currentUser.id,
                                toUserId: createdTargetUser.id,
                                text: message.text,
                                isRead: false,
                            }),
                        );
                    })
                    .end(done);
            });
        });
    });

    describe('PUT /message/mark-as-read', () => {
        const URL = '/message/mark-as-read';

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .put(URL)
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 400, if either "fromId" or "toId" are not specified', done => {
            const EXPECTED_ERROR_MESSAGE = 'Fields "fromId" and "toId" should be specified';
            const targetUser = mockFactory.create('user', {
                omit: ['id'],
            });

            User.create(targetUser)
                .then(createdTargetUser => {
                    const message = mockFactory.create('message', {
                        omit: ['id'],
                        defaults: {
                            toUserId: currentUser.id,
                            fromUserId: createdTargetUser.id,
                            isRead: false,
                        },
                    });

                    return Message.create(message);
                })
                .then(createdMessage => {
                    const range = {
                        fromId: createdMessage.id,
                        toId: null,
                    };

                    return new Promise(resolve => {
                        request(app)
                            .put(URL)
                            .send(range)
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, authorizationHeader)
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

        it('should respond with 400, if "fromId" greater than "toId"', done => {
            const EXPECTED_ERROR_MESSAGE = 'Value of "fromId" should be less than value of "toId"';
            const targetUser = mockFactory.create('user', {
                omit: ['id'],
            });

            User.create(targetUser)
                .then(createdTargetUser => {
                    const createMessage = () =>
                        mockFactory.create('message', {
                            omit: ['id'],
                            defaults: {
                                toUserId: currentUser.id,
                                fromUserId: createdTargetUser.id,
                                isRead: false,
                            },
                        });
                    const messages = _.times(2, () => createMessage());

                    return Promise.map(messages, message => Message.create(message));
                })
                .then(createdMessages => {
                    const range = {
                        fromId: _(createdMessages)
                            .map(message => message.id)
                            .max(),
                        toId: _(createdMessages)
                            .map(message => message.id)
                            .min(),
                    };

                    return new Promise(resolve => {
                        request(app)
                            .put(URL)
                            .send(range)
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, authorizationHeader)
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

        it('should respond with 204, if all conditions passed', done => {
            const targetUser = mockFactory.create('user', {
                omit: ['id'],
            });

            User.create(targetUser)
                .then(createdTargetUser => {
                    const createMessage = () =>
                        mockFactory.create('message', {
                            omit: ['id'],
                            defaults: {
                                toUserId: currentUser.id,
                                fromUserId: createdTargetUser.id,
                                isRead: false,
                            },
                        });
                    const messages = _.times(2, () => createMessage());

                    return Promise.map(messages, message => Message.create(message));
                })
                .then(createdMessages => {
                    const range = {
                        fromId: _(createdMessages)
                            .map(message => message.id)
                            .min(),
                        toId: _(createdMessages)
                            .map(message => message.id)
                            .max(),
                    };

                    return new Promise(resolve => {
                        request(app)
                            .put(URL)
                            .send(range)
                            .set(Header.ACCEPT, Accept.JSON)
                            .set(Header.AUTHORIZATION, authorizationHeader)
                            .expect(Header.CONTENT_TYPE, ContentType.JSON)
                            .expect(204, resolve);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should update "isRead" field for messages with id between "fromId" and "toId", if message addressed to current user', done => {
            const createUser = () => mockFactory.create('user', { omit: ['id'] });
            const users = _.times(2, () => createUser());

            Promise.map(users, user => User.create(user))
                .spread((createdTargetUser, createdSideUser) => {
                    const createMessage = toUserId =>
                        mockFactory.create('message', {
                            omit: ['id'],
                            defaults: {
                                toUserId,
                                fromUserId: createdTargetUser.id,
                                isRead: false,
                            },
                        });

                    const messages = [
                        createMessage(currentUser.id),
                        createMessage(createdSideUser.id),
                        createMessage(currentUser.id),
                    ];

                    return Promise.map(messages, message => Message.create(message));
                })
                .then(createdMessages => ({
                    fromId: _(createdMessages)
                        .map(message => message.id)
                        .min(),
                    toId: _(createdMessages)
                        .map(message => message.id)
                        .max(),
                }))
                .tap(
                    range =>
                        new Promise(resolve => {
                            request(app)
                                .put(URL)
                                .send(range)
                                .set(Header.ACCEPT, Accept.JSON)
                                .set(Header.AUTHORIZATION, authorizationHeader)
                                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                                .end(resolve);
                        }),
                )
                .then(range => Message.findAll({ where: { id: { [Op.between]: [range.fromId, range.toId] } } }))
                .then(foundMessages => {
                    _.each(foundMessages, message => {
                        expect(message.isRead).toBe(
                            message.toUserId === currentUser.id,
                            `Only messages refer to current user should be marked as read`,
                        );
                    });
                })
                .catch(fail)
                .finally(done);
        });
    });
});
