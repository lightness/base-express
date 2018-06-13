const express = require('express');

const db = require('../models');
const errorHandler = require('../errors/default-handler');
const UserNotFoundError = require('../errors/user/user-not-found-error');
const FriendshipNotFoundError = require('../errors/friendship/friendship-not-found-error');
const FriendshipAlreadyExistsError = require('../errors/friendship/friendship-already-exists-error');
const FriendshipAlreadyAcceptedError = require('../errors/friendship/friendship-already-accepted-error');
const FriendshipAlreadyRejectedError = require('../errors/friendship/friendship-already-rejected-error');
const WrongFriendshipTargetError = require('../errors/friendship/wrong-friendship-target-error');

const Op = db.Sequelize.Op;
const router = express.Router();

router.get('/requests', (req, res) => {
    const currentUserId = req.user.userId;

    db.Friendship.findAll({
        where: {
            [Op.or]: [
                { fromUserId: currentUserId },
                { toUserId: currentUserId },
            ],
            [Op.or]: [
                { status: db.Friendship.Status.REJECTED },
                { status: db.Friendship.Status.REQUESTED },
            ],
        },
    })
        .then(friendships => {
            res.json(friendships);
        })
        .catch(errorHandler(res));
});

router.get('/friends', (req, res) => {
    const currentUserId = req.user.userId;

    db.Friendship.findAll({
        where: {
            [Op.or]: [
                { fromUserId: currentUserId },
                { toUserId: currentUserId },
            ],
            status: db.Friendship.Status.ACCEPTED,
        },
        include: [
            {
                model: db.User,
                as: 'fromUser',
                required: false,
                where: {
                    id: { [Op.ne]: currentUserId },
                },
            },
            {
                model: db.User,
                as: 'toUser',
                required: false,
                where: {
                    id: { [Op.ne]: currentUserId },
                },
            },
        ],
    })
        .then(friendships => {
            res.json(friendships);
        })
        .catch(errorHandler(res));
});

router.post('/request', (req, res) => {
    const fromUserId = req.user.userId;
    const toUserId = req.body.toUserId;

    Promise.resolve()
        .then(() => {
            if (fromUserId === toUserId) {
                throw new WrongFriendshipTargetError(
                    'You can not be a friend to yourself',
                );
            }

            return db.User.findById(toUserId);
        })
        .then(foundUser => {
            if (!foundUser) {
                throw new UserNotFoundError();
            }

            return Promise.all([
                db.Friendship.findOne({
                    where: { fromUserId: fromUserId, toUserId: toUserId },
                }),
                db.Friendship.findOne({
                    where: { fromUserId: toUserId, toUserId: fromUserId },
                }),
            ]);
        })
        .then(instances => {
            if (instances[0] || instances[1]) {
                throw new FriendshipAlreadyExistsError();
            }

            return db.Friendship.create({
                fromUserId: fromUserId,
                toUserId: toUserId,
                status: db.Friendship.Status.REQUESTED,
            });
        })
        .then(createdFriendshipInstance => {
            res.json(createdFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/accept', (req, res) => {
    const friendshipId = req.params.friendshipId;
    const currentUserId = req.user.userId;

    db.Friendship.findById(friendshipId)
        .then(foundFriendshipInstance => {
            if (
                !foundFriendshipInstance ||
                foundFriendshipInstance.toUserId !== currentUserId
            ) {
                throw new FriendshipNotFoundError();
            }

            if (
                foundFriendshipInstance.status === db.Friendship.Status.ACCEPTED
            ) {
                throw new FriendshipAlreadyAcceptedError();
            }

            return foundFriendshipInstance.update({
                status: db.Friendship.Status.ACCEPTED,
            });
        })
        .then(updatedFriendshipInstance => {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/reject', (req, res) => {
    const friendshipId = req.params.friendshipId;

    db.Friendship.findById(friendshipId)
        .then(foundFriendshipInstance => {
            if (
                !foundFriendshipInstance ||
                foundFriendshipInstance.toUserId !== currentUserId
            ) {
                throw new FriendshipNotFoundError();
            }

            if (
                foundFriendshipInstance.status === db.Friendship.Status.REJECT
            ) {
                throw new FriendshipAlreadyRejectedError();
            }

            return foundFriendshipInstance.update({
                status: db.Friendship.Status.REJECT,
            });
        })
        .then(updatedFriendshipInstance => {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.delete('/:friendshipId', (req, res) => {
    const friendshipId = req.params.friendshipId;
    const currentUserId = req.user.userId;

    db.Friendship.findById(friendshipId)
        .then(foundFriendshipInstance => {
            if (!foundFriendshipInstance) {
                throw new FriendshipNotFoundError();
            }

            if (
                foundFriendshipInstance.fromUserId !== currentUserId &&
                foundFriendshipInstance.toUserId !== currentUserId
            ) {
                throw new FriendshipNotFoundError();
            }

            return foundFriendshipInstance.destroy();
        })
        .then(() => {
            res.send(200);
        })
        .catch(errorHandler(res));
});

module.exports = router;
