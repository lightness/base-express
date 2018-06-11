'use strict';
let _ = require('lodash');

module.exports = (sequelize, DataTypes) => {
    let FriendshipStatus = Object.freeze({
        REQUESTED: 'requested',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
    });

    let Friendship = sequelize.define('Friendship', {
        fromUserId: { type: DataTypes.INTEGER, allowNull: false },
        toUserId: { type: DataTypes.INTEGER, allowNull: false },
        status: {
            type: DataTypes.ENUM,
            values: _.values(FriendshipStatus),
            allowNull: false,
            default: FriendshipStatus.REQUESTED,
        },
    }, {
        indexes: [
            { unique: true, fields: ['fromUserId', 'toUserId'] }
        ]
    });

    Friendship.associate = function(models) {
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

    return Friendship;
};
