const _ = require('lodash');

const db = require('./models');
const NotAuthorizedError = require('./errors/not-authorized-error');

module.exports = {
    setup: function(app) {
        this.longpoll = require('express-longpoll')(app);

        this.longpoll.create('/poll/:id', function(req, res, next) {
            let userId = +req.params.id;
            let currentUserId = req.user.userId;

            if (userId !== currentUserId) {
                throw new NotAuthorizedError();
            }

            req.id = currentUserId;

            db.Message.findAll({
                where: {
                    toUserId: currentUserId,
                    isRead: false,
                },
                order: [['id', 'ASC']],
                limit: 100,
            }).then(function(foundMessageInstances) {
                if (_.isEmpty(foundMessageInstances)) {
                    return next();
                }

                res.json(foundMessageInstances);
            });
        });
    },
    publish: function(userId, message) {
        this.longpoll.publishToId('/poll/:id', userId, [message.toJSON()]);
    },
};
