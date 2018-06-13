const dream = require('dreamjs');

dream.customType('incrementalId', (helper) => {
    return helper.previousItem ? helper.previousItem.id + 1 : 1;
});