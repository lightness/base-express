'use strict';
const express = require('express');
const { Op } = require('sequelize');

const longPoll = require('../long-poll');
const { Message, User } = require('../models');
const { errorHandler, MessageRangeError, WrongMessageTargetError } = require('../errors');

const router = express.Router();

router.post('/send', (req, res) => {
    const fromUserId = req.user.userId;
    const toUserId = req.body.toUserId;

    Promise.resolve()
        .then(() => {
            if (fromUserId === toUserId) {
                throw new WrongMessageTargetError('You can not send a message to yourself');
            }

            return User.findById(toUserId);
        })
        .then(foundToUser => {
            if (!foundToUser) {
                throw new WrongMessageTargetError('Wrong target user id specified');
            }

            return Message.create({
                fromUserId: fromUserId,
                toUserId: toUserId,
                text: req.body.text,
            });
        })
        .then(createdMessage => {
            longPoll.publish(createdMessage.toUserId, createdMessage.toJSON());

            res.json(createdMessage);
        })
        .catch(errorHandler(res));
});

router.put('/mark-as-read', (req, res) => {
    const currentUserId = req.user.userId;
    const fromId = req.body.fromId;
    const toId = req.body.toId;

    Promise.resolve()
        .then(() => {
            if (!fromId || !toId) {
                throw new MessageRangeError('Fields "fromId" and "toId" should be specified');
            }

            if (fromId && toId && fromId > toId) {
                throw new MessageRangeError('Value of "fromId" should be less than value of "toId"');
            }

            return Message.update(
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
        .then(() => {
            res.status(204).end();
        })
        .catch(errorHandler(res));
});

module.exports = router;
