'use strict';
const Sequelize = require('sequelize');

const sequelize = require('./sequelize');

const User = sequelize.define(
    'User',
    {
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        fullName: { type: Sequelize.STRING, allowNull: false },
    },
    {
        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        scopes: {
            withPassword: {},
        },
    },
);

User.associate = models => {
    models.User.hasMany(models.Friendship, {
        as: 'fromUser',
        foreignKey: 'fromUserId',
    });

    models.User.hasMany(models.Friendship, {
        as: 'toUser',
        foreignKey: 'toUserId',
    });
};

module.exports = User;
