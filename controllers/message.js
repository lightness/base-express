let express = require('express');
let jwt = require('express-jwt');

let jwtHelper = require('../helpers/jwt');
let models = require('../models');
let router = express.Router();

router.post('/send', jwt({ secret: jwtHelper.secret }), function(req, res) {
    let fromUserId = req.user.userId;
    let toUserId = req.body.toUserId;

    if (fromUserId === toUserId) {
        res.send(400, 'You can not send a message to yourself');
    }

    models.Message.create({
        fromUserId: fromUserId,
        toUserId: toUserId,
        text: req.body.text,
    }).then(function(createdMessage) {
        res.json(createdMessage);
    });
});

module.exports = router;
