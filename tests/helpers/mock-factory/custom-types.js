'use strict';
const dream = require('dreamjs');

dream.customType('incrementalId', helper => (helper.previousItem ? helper.previousItem.id + 1 : 1));

dream.customType('password', helper => helper.chance.word({ length: 10 }));
