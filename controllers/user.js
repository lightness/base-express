let _ = require('lodash');
let bcrypt = require('bcrypt');
let express = require('express');

let models = require('../models');
let jwtHelper = require('../helpers/jwt');
let errorHandler = require('../errors/default-handler');
let BadCredentialsError = require('../errors/user/bad-credentials-error');
let UserAlreadyExistsError = require('../errors/user/user-already-exists-error');

let router = express.Router();

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
                throw new BadCredentialsError(`Bad credentials`);
            }

            return bcrypt
                .compare(password, foundUser.password)
                .then(function(isPasswordCorrect) {
                    if (!isPasswordCorrect) {
                        throw new BadCredentialsError(`Bad credentials`);
                    }

                    return jwtHelper.createJwt(foundUser.id);
                });
        })
        .then(function(jwt) {
            res.setHeader('authorization', 'Bearer ' + jwt);
            res.send(200);
        })
        .catch(errorHandler(res));
});

router.post('/register', function(req, res) {
    let password = req.body.password;
    let email = req.body.email;

    models.User.findOne({
        where: { email: email },
    })
        .then(function(foundUser) {
            if (foundUser) {
                throw new UserAlreadyExistsError();
            }

            return bcrypt.hash(password, 10);
        })
        .then(function(hash) {
            return models.User.create({
                email: email,
                password: hash,
                fullName: req.body.fullName,
            });
        })
        .then(function(createdUserInstance) {
            let createdUser = createdUserInstance.toJSON();
            let response = _.omit(createdUser, 'password');

            res.json(response);
        })
        .catch(errorHandler(res));
});

module.exports = router;
