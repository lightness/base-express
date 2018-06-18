'use strict';
const express = require('express');
const { Op } = require('sequelize');

const { Friendship, User } = require('../models');
const {
    errorHandler,
    UserNotFoundError,
    FriendshipNotFoundError,
    WrongFriendshipTargetError,
    FriendshipAlreadyExistsError,
    FriendshipAlreadyAcceptedError,
    FriendshipAlreadyRejectedError,
} = require('../errors');

const router = express.Router();

router.get('/requests', (req, res) => {
    const currentUserId = req.user.userId;

    Friendship.findAll({
        where: {
            [Op.or]: [{ fromUserId: currentUserId }, { toUserId: currentUserId }],
            [Op.or]: [{ status: Friendship.Status.REJECTED }, { status: Friendship.Status.REQUESTED }],
        },
    })
        .then(friendships => {
            res.json(friendships);
        })
        .catch(errorHandler(res));
});

router.get('/friends', (req, res) => {
    const currentUserId = req.user.userId;

    Friendship.findAll({
        where: {
            [Op.or]: [{ fromUserId: currentUserId }, { toUserId: currentUserId }],
            status: Friendship.Status.ACCEPTED,
        },
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
                throw new WrongFriendshipTargetError('You can not be a friend to yourself');
            }

            return User.findById(toUserId);
        })
        .then(foundUser => {
            if (!foundUser) {
                throw new UserNotFoundError();
            }

            return Promise.all([
                Friendship.findOne({
                    where: { fromUserId: fromUserId, toUserId: toUserId },
                }),
                Friendship.findOne({
                    where: { fromUserId: toUserId, toUserId: fromUserId },
                }),
            ]);
        })
        .then(instances => {
            if (instances[0] || instances[1]) {
                throw new FriendshipAlreadyExistsError();
            }

            return Friendship.create({
                fromUserId: fromUserId,
                toUserId: toUserId,
                status: Friendship.Status.REQUESTED,
            });
        })
        .then(createdFriendship => Friendship.findById(createdFriendship.id))
        .then(createdFriendship => {
            res.json(createdFriendship);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/accept', (req, res) => {
    const friendshipId = req.params.friendshipId;
    const currentUserId = req.user.userId;

    Friendship.findById(friendshipId)
        .then(foundFriendshipInstance => {
            if (!foundFriendshipInstance || foundFriendshipInstance.toUserId !== currentUserId) {
                throw new FriendshipNotFoundError();
            }

            switch (foundFriendshipInstance.status) {
                case Friendship.Status.ACCEPTED:
                    throw new FriendshipAlreadyAcceptedError();
                case Friendship.Status.REJECTED:
                    throw new FriendshipAlreadyRejectedError();
            }

            return foundFriendshipInstance.update({
                status: Friendship.Status.ACCEPTED,
            });
        })
        .then(updatedFriendshipInstance => {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/reject', (req, res) => {
    const friendshipId = req.params.friendshipId;
    const currentUserId = req.user.userId;

    Friendship.findById(friendshipId)
        .then(foundFriendshipInstance => {
            if (!foundFriendshipInstance || foundFriendshipInstance.toUserId !== currentUserId) {
                throw new FriendshipNotFoundError();
            }

            switch (foundFriendshipInstance.status) {
                case Friendship.Status.ACCEPTED:
                    throw new FriendshipAlreadyAcceptedError();
                case Friendship.Status.REJECTED:
                    throw new FriendshipAlreadyRejectedError();
            }

            return foundFriendshipInstance.update({
                status: Friendship.Status.REJECTED,
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

    Friendship.findById(friendshipId)
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
            res.status(204).end();
        })
        .catch(errorHandler(res));
});

module.exports = router;
