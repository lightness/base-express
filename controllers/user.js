const _ = require('lodash');
const bcrypt = require('bcrypt');
const express = require('express');

const db = require('../models');
const jwtHelper = require('../helpers/jwt');
const errorHandler = require('../errors/default-handler');
const UserNotForundError = require('../errors/user/user-not-found-error');
const BadCredentialsError = require('../errors/user/bad-credentials-error');
const UserAlreadyExistsError = require('../errors/user/user-already-exists-error');

const Op = db.Sequelize.Op;
const router = express.Router();

router.get('/me', function(req, res) {
    const currentUserId = req.user.userId;

    db.User.findById(currentUserId)
        .then(function(foundUser) {
            if (!foundUser) {
                throw new UserNotForundError();
            }

            res.json(foundUser);
        })
        .catch(errorHandler(res));
});

router.get('/:id', function(req, res) {
    const targetUserId = req.params.id;

    db.User.findById(targetUserId)
        .then(function(foundUser) {
            if (!foundUser) {
                throw new UserNotForundError();
            }

            // In future there should be privacy policy checks
            // For example, be visible only for friends, or for friends of friends

            res.json(foundUser);
        })
        .catch(errorHandler(res));
});

router.post('/login', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    db.User.scope('withPassword')
        .findOne({
            where: {
                email: email,
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

                    res.setHeader('authorization', jwtHelper.createAuthHeader(foundUser.id));
                    res.status(200).end();
                });
        })
        .catch(errorHandler(res));
});

router.post('/register', function(req, res) {
    const password = req.body.password;
    const email = req.body.email;

    db.User.findOne({
        where: { email: email },
    })
        .then(function(foundUser) {
            if (foundUser) {
                throw new UserAlreadyExistsError();
            }

            return bcrypt.hash(password, 10);
        })
        .then(function(hash) {
            return db.User.create({
                email: email,
                password: hash,
                fullName: req.body.fullName,
            });
        })
        .then(function(createdUser) {
            res.json(createdUser);
        })
        .catch(errorHandler(res));
});

router.get('/', function(req, res) {
    const q = req.query.q;
    const currentUserId = req.user.userId;

    db.User.findAll({
        where: {
            [Op.or]: [
                {
                    fullName: { [Op.like]: '%' + q + '%' },
                },
                {
                    email: { [Op.like]: '%' + q + '%' },
                },
            ],
            id: { [Op.ne]: currentUserId },
        },
    })
        .then(function(foundUsers) {
            res.json(foundUsers);
        })
        .catch(errorHandler(res));
});

module.exports = router;
