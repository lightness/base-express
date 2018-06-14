const _ = require('lodash');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const express = require('express');

const db = require('../models');
const jwtHelper = require('../helpers/jwt');
const errorHandler = require('../errors/default-handler');
const ValidationError = require('../errors/validation-error');
const UserNotForundError = require('../errors/user/user-not-found-error');
const BadCredentialsError = require('../errors/user/bad-credentials-error');
const UserAlreadyExistsError = require('../errors/user/user-already-exists-error');

const Op = db.Sequelize.Op;
const router = express.Router();

router.get('/me', (req, res) => {
    const currentUserId = req.user.userId;

    db.User.findById(currentUserId)
        .then(foundUser => {
            if (!foundUser) {
                throw new UserNotForundError();
            }

            res.json(foundUser);
        })
        .catch(errorHandler(res));
});

router.get('/:id', (req, res) => {
    const targetUserId = req.params.id;

    db.User.findById(targetUserId)
        .then(foundUser => {
            if (!foundUser) {
                throw new UserNotForundError();
            }

            // In future there should be privacy policy checks
            // For example, be visible only for friends, or for friends of friends

            res.json(foundUser);
        })
        .catch(errorHandler(res));
});

router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.User.scope('withPassword')
        .findOne({
            where: {
                email: email,
            },
        })
        .then(foundUser => {
            if (!foundUser) {
                throw new BadCredentialsError(`Bad credentials`);
            }

            return bcrypt
                .compare(password, foundUser.password)
                .then(isPasswordCorrect => {
                    if (!isPasswordCorrect) {
                        throw new BadCredentialsError(`Bad credentials`);
                    }

                    res.setHeader(
                        'authorization',
                        jwtHelper.createAuthHeader(foundUser.id),
                    );
                    res.status(200).end();
                });
        })
        .catch(errorHandler(res));
});

router.post('/register', (req, res) => {
    const password = req.body.password;
    const email = req.body.email;
    const fullName = req.body.fullName;

    Promise.resolve()
        .then(function() {
            const validationSchema = {
                email: Joi.string()
                    .email()
                    .required(),
                fullName: Joi.string().required(),
                password: Joi.string()
                    .min(8)
                    .required(),
            };

            const validationResult = Joi.validate(req.body, validationSchema);

            if (validationResult.error) {
                throw new ValidationError(validationResult.error.details[0].message);
            }

            return db.User.findOne({ where: { email } });
        })
        .then(foundUser => {
            if (foundUser) {
                throw new UserAlreadyExistsError();
            }

            return bcrypt.hash(password, 10);
        })
        .then(hash => db.User.create({ email, password: hash, fullName }))
        .then(createdUserInstance => {
            let response = _.omit(createdUserInstance.toJSON(), ['password']);
            res.json(response);
        })
        .catch(errorHandler(res));
});

router.get('/', (req, res) => {
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
        .then(foundUsers => {
            res.json(foundUsers);
        })
        .catch(errorHandler(res));
});

module.exports = router;
