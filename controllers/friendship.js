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

router.get('/requests', function(req, res) {
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
        .then(function(friendships) {
            res.json(friendships);
        })
        .catch(errorHandler(res));
});

router.get('/friends', function(req, res) {
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
        .then(function(friendships) {
            res.json(friendships);
        })
        .catch(errorHandler(res));
});

router.post('/request', function(req, res) {
    const fromUserId = req.user.userId;
    const toUserId = req.body.toUserId;

    Promise.resolve()
        .then(function() {
            if (fromUserId === toUserId) {
                throw new WrongFriendshipTargetError(
                    'You can not be a friend to yourself',
                );
            }

            return db.User.findById(toUserId);
        })
        .then(function(foundUser) {
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
        .then(function(instances) {
            if (instances[0] || instances[1]) {
                throw new FriendshipAlreadyExistsError();
            }

            return db.Friendship.create({
                fromUserId: fromUserId,
                toUserId: toUserId,
                status: db.Friendship.Status.REQUESTED,
            });
        })
        .then(function(createdFriendshipInstance) {
            res.json(createdFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/accept', function(req, res) {
    const friendshipId = req.params.friendshipId;
    const currentUserId = req.user.userId;

    db.Friendship.findById(friendshipId)
        .then(function(foundFriendshipInstance) {
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
        .then(function(updatedFriendshipInstance) {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/reject', function(req, res) {
    const friendshipId = req.params.friendshipId;

    db.Friendship.findById(friendshipId)
        .then(function(foundFriendshipInstance) {
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
        .then(function(updatedFriendshipInstance) {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.delete('/:friendshipId', function(req, res) {
    const friendshipId = req.params.friendshipId;
    const currentUserId = req.user.userId;

    db.Friendship.findById(friendshipId)
        .then(function(foundFriendshipInstance) {
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
        .then(function() {
            res.send(200);
        })
        .catch(errorHandler(res));
});

module.exports = router;
