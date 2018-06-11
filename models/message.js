'use strict';
module.exports = (sequelize, DataTypes) => {
    var Message = sequelize.define('Message', {
        text: DataTypes.STRING,
        fromUserId: DataTypes.INTEGER,
        toUserId: DataTypes.INTEGER,
    });

    Message.associate = function(models) {
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
