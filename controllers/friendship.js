let express = require('express');
let jwt = require('express-jwt');

let db = require('../models');
let jwtHelper = require('../helpers/jwt');
let errorHandler = require('../errors/default-handler');
let FriendshipNotFoundError = require('../errors/friendship/friendship-not-found-error');
let FriendshipAlreadyExistsError = require('../errors/friendship/friendship-already-exists-error');
let FriendshipAlreadyAcceptedError = require('../errors/friendship/friendship-already-accepted-error');
let FriendshipAlreadyRejectedError = require('../errors/friendship/friendship-already-rejected-error');

const Op = db.Sequelize.Op;
const router = express.Router();
const jwtMiddleware = jwt({ secret: jwtHelper.secret });

router.get('/requests', jwtMiddleware, function(req, res) {
    let currentUserId = req.user.userId;

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

router.get('/friends', jwtMiddleware, function(req, res) {
    let currentUserId = req.user.userId;

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

router.post('/request', jwtMiddleware, function(req, res) {
    let fromUserId = req.user.userId;
    let toUserId = req.body.toUserId;

    if (fromUserId === toUserId) {
        res.send(400, 'You can not be a friend to yourself');
    }

    Promise.all([
        db.Friendship.findOne({
            where: { fromUserId: fromUserId, toUserId: toUserId },
        }),
        db.Friendship.findOne({
            where: { fromUserId: toUserId, toUserId: fromUserId },
        }),
    ])
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

router.put('/:friendshipId/accept', jwtMiddleware, function(req, res) {
    let friendshipId = req.params.friendshipId;
    let currentUserId = req.user.userId;

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

router.put('/:friendshipId/reject', jwtMiddleware, function(req, res) {
    let friendshipId = req.params.friendshipId;

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

router.delete('/:friendshipId', jwtMiddleware, function(req, res) {
    let friendshipId = req.params.friendshipId;
    let currentUserId = req.user.userId;

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
