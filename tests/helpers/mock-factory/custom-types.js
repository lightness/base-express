const dream = require('dreamjs');

dream.customType('incrementalId', function(helper) {
    return helper.previousItem ? helper.previousItem.id + 1 : 1;
});