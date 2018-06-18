const _ = require('lodash');
const request = require('supertest');

const app = require('../../app');
const sequelize = require('../../models/sequelize');
const jwtHelper = require('../../helpers/jwt');
const mockFactory = require('../helpers/mock-factory');
const expectations = require('../helpers/common-expectations');
const { User, Friendship } = require('../../models');
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

    describe('GET /friendship/friends', () => {
        const URL = '/friendship/friends';

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

        it('should respond with 200 and return list of accepted outgoing friendship requests', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: currentUser.id,
                            toUserId: createdFriend.id,
                            status: Friendship.Status.ACCEPTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .get(URL)
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body).toEqual(jasmine.any(Array));
                            expect(res.body.length).toBe(1);
                            expectations.expectFriendshipsAreEqual(res.body[0], createdFriendship);
                            expectations.expectUsersAreEqual(res.body[0].fromUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body[0].fromUser);
                            expectations.expectUsersAreEqual(res.body[0].toUser, friend);
                            expectations.expectUserWithoutPassword(res.body[0].toUser);
                        })
                        .expect(200, done);
                });
        });

        it('should respond with 200 and return list of accepted incoming friendship requests', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.ACCEPTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .get(URL)
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body).toEqual(jasmine.any(Array));
                            expect(res.body.length).toBe(1);
                            expectations.expectFriendshipsAreEqual(res.body[0], createdFriendship);
                            expectations.expectUsersAreEqual(res.body[0].fromUser, friend);
                            expectations.expectUserWithoutPassword(res.body[0].fromUser);
                            expectations.expectUsersAreEqual(res.body[0].toUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body[0].toUser);
                        })
                        .expect(200, done);
                });
        });
    });

    describe('GET /friendship/requests', () => {
        const URL = '/friendship/requests';

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

        it('should respond with 200 and return list of rejected outgoing friendship requests', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: currentUser.id,
                            toUserId: createdFriend.id,
                            status: Friendship.Status.REJECTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .get(URL)
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body).toEqual(jasmine.any(Array));
                            expect(res.body.length).toBe(1);
                            expectations.expectFriendshipsAreEqual(res.body[0], createdFriendship);
                            expectations.expectUsersAreEqual(res.body[0].fromUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body[0].fromUser);
                            expectations.expectUsersAreEqual(res.body[0].toUser, friend);
                            expectations.expectUserWithoutPassword(res.body[0].toUser);
                        })
                        .expect(200, done);
                });
        });

        it('should respond with 200 and return list of pending outgoing friendship requests', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: currentUser.id,
                            toUserId: createdFriend.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .get(URL)
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body).toEqual(jasmine.any(Array));
                            expect(res.body.length).toBe(1);
                            expectations.expectFriendshipsAreEqual(res.body[0], createdFriendship);
                            expectations.expectUsersAreEqual(res.body[0].fromUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body[0].fromUser);
                            expectations.expectUsersAreEqual(res.body[0].toUser, friend);
                            expectations.expectUserWithoutPassword(res.body[0].toUser);
                        })
                        .expect(200, done);
                });
        });

        it('should respond with 200 and return list of rejected incoming friendship requests', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REJECTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .get(URL)
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body).toEqual(jasmine.any(Array));
                            expect(res.body.length).toBe(1);
                            expectations.expectFriendshipsAreEqual(res.body[0], createdFriendship);
                            expectations.expectUsersAreEqual(res.body[0].fromUser, friend);
                            expectations.expectUserWithoutPassword(res.body[0].fromUser);
                            expectations.expectUsersAreEqual(res.body[0].toUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body[0].toUser);
                        })
                        .expect(200, done);
                });
        });

        it('should respond with 200 and return list of pending incoming friendship requests', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .get(URL)
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body).toEqual(jasmine.any(Array));
                            expect(res.body.length).toBe(1);
                            expectations.expectFriendshipsAreEqual(res.body[0], createdFriendship);
                            expectations.expectUsersAreEqual(res.body[0].fromUser, friend);
                            expectations.expectUserWithoutPassword(res.body[0].fromUser);
                            expectations.expectUsersAreEqual(res.body[0].toUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body[0].toUser);
                        })
                        .expect(200, done);
                });
        });
    });

    describe('POST /friendship/request', () => {
        const URL = '/friendship/request';

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .post(URL)
                .send({ toUserId: currentUser.id })
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 400, if user try to request friendship with itself', done => {
            const EXPECTED_ERROR_MESSAGE = 'You can not be a friend to yourself';

            request(app)
                .post(URL)
                .send({ toUserId: currentUser.id })
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authorizationHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(400, done);
        });

        it('should respond with 404, if target user is not found', done => {
            const EXPECTED_ERROR_MESSAGE = 'User not found';
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
                .expect(404, done);
        });

        it('should respond with 400, if incoming friendship already exists', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship already exists';
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .post(URL)
                        .send({ toUserId: createdFriendship.fromUserId })
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(400, done);
                });
        });

        it('should respond with 400, if outgoing friendship already exists', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship already exists';
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: currentUser.id,
                            toUserId: createdFriend.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .post(URL)
                        .send({ toUserId: createdFriendship.toUserId })
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(400, done);
                });
        });

        it('should respond with 200 and return created friendship request, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend).then(createdFriend => {
                request(app)
                    .post(URL)
                    .send({ toUserId: createdFriend.id })
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authorizationHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(res => {
                        expectations.expectFriendshipsAreEqual(res.body, {
                            fromUserId: currentUser.id,
                            toUserId: createdFriend.id,
                            status: Friendship.Status.REQUESTED,
                        });
                        expectations.expectUsersAreEqual(res.body.fromUser, currentUser);
                        expectations.expectUserWithoutPassword(res.body.fromUser);
                        expectations.expectUsersAreEqual(res.body.toUser, createdFriend);
                        expectations.expectUserWithoutPassword(res.body.toUser);
                    })
                    .expect(200, done);
            });
        });

        it('should persist friendship request to database, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });
            let createdFriendshipId;

            User.create(friend).then(createdFriend => {
                request(app)
                    .post(URL)
                    .send({ toUserId: createdFriend.id })
                    .set(Header.ACCEPT, Accept.JSON)
                    .set(Header.AUTHORIZATION, authorizationHeader)
                    .expect(Header.CONTENT_TYPE, ContentType.JSON)
                    .expect(res => {
                        createdFriendshipId = res.body.id;
                    })
                    .end(() => {
                        Friendship.findById(createdFriendshipId)
                            .then(foundFriendship => {
                                expectations.expectFriendshipsAreEqual(foundFriendship, {
                                    fromUserId: currentUser.id,
                                    toUserId: createdFriend.id,
                                    status: Friendship.Status.REQUESTED,
                                });
                            })
                            .finally(done);
                    });
            });
        });
    });

    describe('PUT /friendship/:id/accept', () => {
        const getUrl = id => `/friendship/${id}/accept`;

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .get(getUrl(1))
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if friendship is not found', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship not found';
            const WRONG_FRIENDSHIP_ID = -1;

            request(app)
                .put(getUrl(WRONG_FRIENDSHIP_ID))
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authorizationHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(404, done);
        });

        it('should respond with 404, if friendship refers to another user', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship not found';
            const user1 = mockFactory.create('user', { omit: ['id'] });
            const user2 = mockFactory.create('user', { omit: ['id'] });

            Promise.all([User.create(user1), User.create(user2)])
                .then(([createdUser1, createdUser2]) => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdUser1.id,
                            toUserId: createdUser2.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(404, done);
                });
        });

        it('should respond with 400, if friendship is already accepted', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship already accepted';
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.ACCEPTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(400, done);
                });
        });

        it('should respond with 400, if friendship is already rejected', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship already rejected';
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REJECTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(400, done);
                });
        });

        it('should respond with 200 and return accepted friendship request, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expectations.expectFriendshipsAreEqual(res.body, {
                                fromUserId: createdFriendship.fromUserId,
                                toUserId: createdFriendship.toUserId,
                                status: Friendship.Status.ACCEPTED,
                            });
                            expectations.expectUsersAreEqual(res.body.fromUser, friend);
                            expectations.expectUserWithoutPassword(res.body.fromUser);
                            expectations.expectUsersAreEqual(res.body.toUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body.toUser);
                        })
                        .expect(200, done);
                });
        });

        it('should persist accepted friendship to database, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .end(() => {
                            Friendship.findById(createdFriendship.id)
                                .then(foundFriendship => {
                                    expectations.expectFriendshipsAreEqual(foundFriendship, {
                                        fromUserId: createdFriendship.fromUserId,
                                        toUserId: createdFriendship.toUserId,
                                        status: Friendship.Status.ACCEPTED,
                                    });
                                })
                                .finally(done);
                        });
                });
        });
    });

    describe('PUT /friendship/:id/reject', () => {
        const getUrl = id => `/friendship/${id}/reject`;

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .get(getUrl(1))
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if friendship is not found', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship not found';
            const WRONG_FRIENDSHIP_ID = -1;

            request(app)
                .put(getUrl(WRONG_FRIENDSHIP_ID))
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authorizationHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(404, done);
        });

        it('should respond with 404, if friendship refers to another user', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship not found';
            const user1 = mockFactory.create('user', { omit: ['id'] });
            const user2 = mockFactory.create('user', { omit: ['id'] });

            Promise.all([User.create(user1), User.create(user2)])
                .then(([createdUser1, createdUser2]) => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdUser1.id,
                            toUserId: createdUser2.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(404, done);
                });
        });

        it('should respond with 400, if friendship is already accepted', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship already accepted';
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.ACCEPTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(400, done);
                });
        });

        it('should respond with 400, if friendship is already rejected', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship already rejected';
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REJECTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(400, done);
                });
        });

        it('should respond with 200 and return rejected friendship request, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expectations.expectFriendshipsAreEqual(res.body, {
                                fromUserId: createdFriendship.fromUserId,
                                toUserId: createdFriendship.toUserId,
                                status: Friendship.Status.REJECTED,
                            });
                            expectations.expectUsersAreEqual(res.body.fromUser, friend);
                            expectations.expectUserWithoutPassword(res.body.fromUser);
                            expectations.expectUsersAreEqual(res.body.toUser, currentUser);
                            expectations.expectUserWithoutPassword(res.body.toUser);
                        })
                        .expect(200, done);
                });
        });

        it('should persist rejected friendship to database, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .put(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .end(() => {
                            Friendship.findById(createdFriendship.id)
                                .then(foundFriendship => {
                                    expectations.expectFriendshipsAreEqual(foundFriendship, {
                                        fromUserId: createdFriendship.fromUserId,
                                        toUserId: createdFriendship.toUserId,
                                        status: Friendship.Status.REJECTED,
                                    });
                                })
                                .finally(done);
                        });
                });
        });
    });

    describe('DELETE /friendship/:id', () => {
        const getUrl = id => `/friendship/${id}`;

        it('should respond with 401, if authorization token is not set', done => {
            const EXPECTED_ERROR_MESSAGE = 'No authorization token was found';

            request(app)
                .delete(getUrl(1))
                .set(Header.ACCEPT, Accept.JSON)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(401, done);
        });

        it('should respond with 404, if friendship is not found', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship not found';
            const WRONG_FRIENDSHIP_ID = -1;

            request(app)
                .delete(getUrl(WRONG_FRIENDSHIP_ID))
                .set(Header.ACCEPT, Accept.JSON)
                .set(Header.AUTHORIZATION, authorizationHeader)
                .expect(Header.CONTENT_TYPE, ContentType.JSON)
                .expect(res => {
                    expect(res.body).toBeDefined();
                    expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                })
                .expect(404, done);
        });

        it('should respond with 404, if friendship refers to another users', done => {
            const EXPECTED_ERROR_MESSAGE = 'Friendship not found';
            const user1 = mockFactory.create('user', { omit: ['id'] });
            const user2 = mockFactory.create('user', { omit: ['id'] });

            Promise.all([User.create(user1), User.create(user2)])
                .then(([createdUser1, createdUser2]) => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdUser1.id,
                            toUserId: createdUser2.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .delete(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(res => {
                            expect(res.body).toBeDefined();
                            expect(res.body.message).toBe(EXPECTED_ERROR_MESSAGE);
                        })
                        .expect(404, done);
                });
        });

        it('should respond with 200, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .delete(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .expect(200, done);
                });
        });

        it('should destroy friendship, if all conditions passed', done => {
            const friend = mockFactory.create('user', { omit: ['id'] });

            User.create(friend)
                .then(createdFriend => {
                    const friendship = mockFactory.create('friendship', {
                        omit: ['id'],
                        defaults: {
                            fromUserId: createdFriend.id,
                            toUserId: currentUser.id,
                            status: Friendship.Status.REQUESTED,
                        },
                    });

                    return Friendship.create(friendship);
                })
                .then(createdFriendship => {
                    request(app)
                        .delete(getUrl(createdFriendship.id))
                        .set(Header.ACCEPT, Accept.JSON)
                        .set(Header.AUTHORIZATION, authorizationHeader)
                        .expect(Header.CONTENT_TYPE, ContentType.JSON)
                        .end(() => {
                            Friendship.findById(createdFriendship.id)
                                .then(foundFriendship => {
                                    expect(foundFriendship).toBeNull();
                                })
                                .finally(done);
                        });
                });
        });
    });
});
