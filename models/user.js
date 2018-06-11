'use strict';
module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        fullName: DataTypes.STRING,
    });

    User.associate = function(models) {};

    return User;
};
