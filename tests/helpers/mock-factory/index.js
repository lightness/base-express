'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const dream = require('dreamjs');

require('./custom-types');

fs.readdirSync(__dirname)
    .filter(file => {
        return file.slice(-10) === '.schema.js';
    })
    .forEach(file => {
        require(path.join(__dirname, file.slice(0, -3)));
    });

function create(schema, options) {
    const defaults = (options && options.defaults) || {};
    const omit = (options && options.omit) || [];

    const generatedMock = dream
        .useSchema(schema)
        .generateRnd()
        .output();
    const mock = _(defaults)
        .defaultsDeep(generatedMock)
        .omit(omit)
        .value();

    return mock;
}

module.exports = {
    create: create,
};
