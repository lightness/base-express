var express = require('express');
var jwt = require('express-jwt');

var jwtHelper = require('../helpers/jwt');
var models = require('../models');
var router = express.Router();

router.post('/send', jwt({ secret: jwtHelper.secret }), function(req, res) {
    models.Message.create({
        fromUserId: req.user.userId,
        toUserId: req.body.toUserId,
        text: req.body.text,
    }).then(function(createdMessage) {
        res.json(createdMessage);
    });
});

module.exports = router;
