'use strict';
const Sequelize = require('sequelize');

const sequelize = require('./sequelize');

const Message = sequelize.define('Message', {
    text: { type: Sequelize.STRING, allowNull: false },
    fromUserId: { type: Sequelize.INTEGER, allowNull: false },
    toUserId: { type: Sequelize.INTEGER, allowNull: false },
    isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
});

Message.associate = models => {
    models.Message.belongsTo(models.User, {
        as: 'fromUser',
        foreignKey: 'fromUserId',
    });

    models.Message.belongsTo(models.User, {
        as: 'toUser',
        foreignKey: 'toUserId',
    });
};

module.exports = Message;
