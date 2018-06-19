'use strict';
const _ = require('lodash');

const Longpoll = require('express-longpoll');
const { Message } = require('./models');
const { NotAuthorizedError } = require('./errors');

let longpoll;

function setup(app) {
    longpoll = Longpoll(app);

    longpoll.create('/poll/:id', (req, res, next) => {
        const userId = +req.params.id;
        const currentUserId = req.user.userId;

        if (userId !== currentUserId) {
            throw new NotAuthorizedError();
        }

        req.id = currentUserId;

        Message.findAll({
            where: {
                toUserId: currentUserId,
                isRead: false,
            },
            order: [['id', 'ASC']],
            limit: 100,
        }).then(foundMessageInstances => {
            if (_.isEmpty(foundMessageInstances)) {
                return next();
            }

            res.json(foundMessageInstances);
        });
    });
}

function publish(userId, message) {
    longpoll.publishToId('/poll/:id', userId, [message.toJSON()]);
}

module.exports = { setup, publish };
