'use strict';
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        text: { type: DataTypes.STRING, allowNull: false },
        fromUserId: { type: DataTypes.INTEGER, allowNull: false },
        toUserId: { type: DataTypes.INTEGER, allowNull: false },
        isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    });

    Message.associate = (models) => {
        models.Message.belongsTo(models.User, {
            as: 'fromUser',
            foreignKey: 'fromUserId',
        });

        models.Message.belongsTo(models.User, {
            as: 'toUser',
            foreignKey: 'toUserId',
        });
    };

    return Message;
};
