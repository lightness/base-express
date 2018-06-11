let express = require('express');

let db = require('../models');
let longPoll = require('../long-poll');

const Op = db.Sequelize.Op;
const router = express.Router();

router.post('/send', function(req, res) {
    let fromUserId = req.user.userId;
    let toUserId = req.body.toUserId;

    if (fromUserId === toUserId) {
        res.send(400, 'You can not send a message to yourself');
    }

    db.Message.create({
        fromUserId: fromUserId,
        toUserId: toUserId,
        text: req.body.text,
    }).then(function(createdMessage) {
        longPoll.publish(createdMessage.toUserId, createdMessage);

        res.json(createdMessage);
    });
});

router.put('/markAsRead', function(req, res) {
    let currentUserId = req.user.userId;
    let fromId = req.body.fromId;
    let toId = req.body.toId;

    if (!fromId || !toId) {
        throw new Error('RangeError: "fromId" and "toId" should be specified');
    }

    if (fromId && toId && fromId > toId) {
        throw new Error('RangeError: "fromId" should be less than "toId"'); // TODO
    }

    return db.Message.update(
        { isRead: true },
        {
            where: {
                id: {
                    [Op.between]: [fromId, toId],
                },
                toUserId: currentUserId
            },
        },
    ).then(function() {
        res.status(200).send({});
    });
});

module.exports = router;
