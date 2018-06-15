'use strict';
const _ = require('lodash');
const Sequelize = require('sequelize');

const User = require('./user.model');
const sequelize = require('./sequelize');

const FriendshipStatus = Object.freeze({
    REQUESTED: 'requested',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
});

const Friendship = sequelize.define(
    'Friendship',
    {
        fromUserId: { type: Sequelize.INTEGER, allowNull: false },
        toUserId: { type: Sequelize.INTEGER, allowNull: false },
        status: {
            type: Sequelize.ENUM,
            values: _.values(FriendshipStatus),
            allowNull: false,
            default: FriendshipStatus.REQUESTED,
        },
    },
    {
        indexes: [{ unique: true, fields: ['fromUserId', 'toUserId'] }],
        defaultScope: {
            include: [
                {
                    model: User,
                    as: 'fromUser',
                },
                {
                    model: User,
                    as: 'toUser',
                },
            ],
        },
    },
);

Friendship.associate = models => {
    models.Friendship.belongsTo(models.User, {
        as: 'fromUser',
        foreignKey: 'fromUserId',
    });

    models.Friendship.belongsTo(models.User, {
        as: 'toUser',
        foreignKey: 'toUserId',
    });
};

Friendship.Status = FriendshipStatus;

module.exports = Friendship;
