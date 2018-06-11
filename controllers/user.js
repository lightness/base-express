let _ = require('lodash');
let bcrypt = require('bcrypt');
let express = require('express');

let db = require('../models');
let jwtHelper = require('../helpers/jwt');
let errorHandler = require('../errors/default-handler');
let UserNotForundError = require('../errors/user/user-not-found-error');
let BadCredentialsError = require('../errors/user/bad-credentials-error');
let UserAlreadyExistsError = require('../errors/user/user-already-exists-error');

const Op = db.Sequelize.Op;
const router = express.Router();

router.get('/me', function(req, res) {
    let currentUserId = req.user.userId;

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
    let targetUserId = req.params.id;

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
    let email = req.body.email;
    let password = req.body.password;

    db.User.scope('withPassword').findOne({
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
    let q = req.query.q;
    let currentUserId = req.user.userId;

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
