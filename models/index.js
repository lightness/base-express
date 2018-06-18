'use strict';
const fs = require('fs');
const path = require('path');

const db = {};

fs.readdirSync(__dirname)
    .filter(file => file.slice(-9) === '.model.js')
    .forEach(file => {
        const model = require(path.join(__dirname, file.slice(0, -3)));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
