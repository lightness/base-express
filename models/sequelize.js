'use strict';

const Sequelize = require('sequelize');

const env = require('../config/env');
const config = require(__dirname + '/../config/config.js')[env.getEnv()];

let sequelize; 

if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config,
    );
}

module.exports = sequelize;