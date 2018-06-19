'use strict';
const dream = require('dreamjs');

dream.schema('message', {
    id: 'incrementalId',
    fromUserId: 'natural',
    toUserId: 'natural',
    text: 'sentence',
    isRead: 'bool'
});
