let express = require('express');
let jwt = require('express-jwt');

let models = require('../models');
let jwtHelper = require('../helpers/jwt');
let errorHandler = require('../errors/default-handler');
let FriendshipNotFoundError = require('../errors/friendship/friendship-not-found-error');
let FriendshipAlreadyExistsError = require('../errors/friendship/friendship-already-exists-error');

let router = express.Router();
let jwtMiddleware = jwt({ secret: jwtHelper.secret });

router.post('/request', jwtMiddleware, function(req, res) {
    let fromUserId = req.user.userId;
    let toUserId = req.body.toUserId;

    if (fromUserId === toUserId) {
        res.send(400, 'You can not be a friend to yourself');
    }

    Promise.all([
        models.Friendship.findOne({
            where: { fromUserId: fromUserId, toUserId: toUserId },
        }),
        models.Friendship.findOne({
            where: { fromUserId: toUserId, toUserId: fromUserId },
        }),
    ])
        .then(function(instances) {
            if (instances[0] || instances[1]) {
                throw new FriendshipAlreadyExistsError();
            }

            return models.Friendship.create({
                fromUserId: fromUserId,
                toUserId: toUserId,
                status: models.Friendship.Status.REQUESTED,
            });
        })
        .then(function(createdFriendshipInstance) {
            res.json(createdFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/accept', jwtMiddleware, function(req, res) {
    let friendshipId = req.params.friendshipId;
    let currentUserId = req.user.userId;

    models.Friendship.findById(friendshipId)
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

            if (foundFriendshipInstance.status === models.Friendship.Status.ACCEPTED) {
                throw new FriendshipAlreadyAcceptedError();
            }

            return foundFriendshipInstance.update({
                status: models.Friendship.Status.ACCEPTED,
            });
        })
        .then(function(updatedFriendshipInstance) {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.put('/:friendshipId/reject', jwtMiddleware, function(req, res) {
    let friendshipId = req.params.friendshipId;

    models.Friendship.findById(friendshipId)
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

            return foundFriendshipInstance.update({
                status: models.Friendship.Status.REJECT,
            });
        })
        .then(function(updatedFriendshipInstance) {
            res.json(updatedFriendshipInstance);
        })
        .catch(errorHandler(res));
});

router.delete('/:friendshipId', jwtMiddleware, function(req, res) {
    let friendshipId = req.params.friendshipId;
    let currentUserId = req.user.userId;

    models.Friendship.findById(friendshipId)
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
