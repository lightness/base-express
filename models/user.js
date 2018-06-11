'use strict';
module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('User', {
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        fullName: { type: DataTypes.STRING, allowNull: false },
    });

    User.associate = function(models) {};

    return User;
};
