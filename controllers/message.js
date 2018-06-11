let express = require('express');

let db = require('../models');

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
        res.json(createdMessage);
    });
});

module.exports = router;
