const express = require('express');

const db = require('../models');
const longPoll = require('../long-poll');
const errorHandler = require('../errors/default-handler');
const MessageRangeError = require('../errors/mesasge/message-range-error');
const WrongMessageTargetError = require('../errors/mesasge/wrong-message-target-error');

const Op = db.Sequelize.Op;
const router = express.Router();

router.post('/send', function(req, res) {
    const fromUserId = req.user.userId;
    const toUserId = req.body.toUserId;

    Promise.resolve()
        .then(function() {
            if (fromUserId === toUserId) {
                throw new WrongMessageTargetError('You can not send a message to yourself');
            }

            return db.User.findById(toUserId);
        })
        .then(function(foundToUser) {
            if (!foundToUser) {
                throw new WrongMessageTargetError('Wrong target user id specified');
            }

            return db.Message.create({
                fromUserId: fromUserId,
                toUserId: toUserId,
                text: req.body.text,
            });
        })
        .then(function(createdMessage) {
            longPoll.publish(createdMessage.toUserId, createdMessage);

            res.json(createdMessage);
        })
        .catch(errorHandler(res));
});

router.put('/markAsRead', function(req, res) {
    const currentUserId = req.user.userId;
    const fromId = req.body.fromId;
    const toId = req.body.toId;

    Promise.resolve()
        .then(function() {
            if (!fromId || !toId) {
                throw new MessageRangeError(
                    'Fields "fromId" and "toId" should be specified',
                );
            }

            if (fromId && toId && fromId > toId) {
                throw new MessageRangeError(
                    'Value of "fromId" should be less than value of "toId"',
                );
            }

            return db.Message.update(
                { isRead: true },
                {
                    where: {
                        id: {
                            [Op.between]: [fromId, toId],
                        },
                        toUserId: currentUserId,
                    },
                },
            );
        })
        .then(function() {
            res.json({});
        })
        .catch(errorHandler(res));
});

module.exports = router;
