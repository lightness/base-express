'use strict';
const _ = require('lodash');
const dream = require('dreamjs');

const { Friendship } = require('../../../models');

dream.customType('friendship.status', helper => {
    const statuses = _.values(Friendship.Status);

    return helper.oneOf(statuses);
});

dream.schema('friendship', {
    id: 'incrementalId',
    fromUserId: 'natural',
    toUserId: 'natural',
    status: 'friendship.status',
});
