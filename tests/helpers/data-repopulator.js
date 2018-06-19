'use strict';
const sequelize = require('../../models/sequelize');

function setupDataRepopulation() {
    beforeEach(done => {
        sequelize
            .sync({ force: true })
            .catch(fail)
            .finally(done);
    });
}

module.exports = setupDataRepopulation;
