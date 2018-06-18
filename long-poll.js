'use strict';
const _ = require('lodash');

const { Message } = require('./models');
const NotAuthorizedError = require('./errors/not-authorized-error');

module.exports = {
    setup: app => {
        this.longpoll = require('express-longpoll')(app);

        this.longpoll.create('/poll/:id', (req, res, next) => {
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
    },
    publish: (userId, message) => {
        this.longpoll.publishToId('/poll/:id', userId, [message.toJSON()]);
    },
};
