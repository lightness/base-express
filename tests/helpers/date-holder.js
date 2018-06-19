'use strict';
function freezeDate() {
    let now;

    beforeEach(() => {
        now = new Date();

        jasmine.clock().install();
        jasmine.clock().mockDate(now);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    return {
        getNow: () => now,
    };
}

module.exports = freezeDate;
