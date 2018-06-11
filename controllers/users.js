var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');

var models = require('../models');
var jwtHelper = require('../helpers/jwt');
var router = express.Router();

router.post('/login', function(req, res) {
    let email = req.body.email;
    let password = req.body.password;

    models.User.findOne({
        where: {
            email: email, // TODO: Make criteria case insensitive
        },
    })
        .then(function(foundUser) {
            if (!foundUser) {
                res.send(401, `Wrong credentials`);
            }

            return bcrypt
                .compare(password, foundUser.password)
                .then(function(isPasswordCorrect) {
                    if (!isPasswordCorrect) {
                        res.send(401, `Wrong credentials`);
                    }

                    return jwtHelper.createJwt(foundUser.id);
                });
        })
        .then(function(jwt) {
            res.setHeader('authorization', 'Bearer '+ jwt);
            res.send(200);
        });
});

router.post('/register', function(req, res) {
    let password = req.body.password;

    bcrypt
        .hash(password, 10)
        .then(function(hash) {
            return models.User.create({
                email: req.body.email,
                password: hash,
                fullName: req.body.fullName,
            });
        })
        .then(function(createdUserInstance) {
            let createdUser = createdUserInstance.toJSON();
            let response = _.omit(createdUser, 'password');

            res.json(response);
        });
});

module.exports = router;
