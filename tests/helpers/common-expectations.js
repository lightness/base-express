'use strict';
function expectUsersAreEqual(target, source) {
    expect(target).toBeDefined(`Target user should be defined`);
    expect(source).toBeDefined(`Source user should be defined`);
    expect(target.email).toBe(source.email, `User email should be same`);
    expect(target.fullName).toBe(source.fullName, `User fullName should be same`);
}

function expectUserWithoutPassword(target) {
    expect(target).toBeDefined(`Target user should be defined`);
    expect(target.password).not.toBeDefined(`User password should not be defined`);
}

function expectFriendshipsAreEqual(target, source) {
    expect(target).toBeDefined(`Target friendship should be defined`);
    expect(source).toBeDefined(`Source friendship should be defined`);
    expect(target.fromUserId).toBe(source.fromUserId, `Friendship fromUserId should be same`);
    expect(target.toUserId).toBe(source.toUserId, `Friendship toUserId should be same`);
    expect(target.status).toBe(source.status, `Friendship status should be same`);
}

function expectMessagesAreEqual(target, source) {
    expect(target).toBeDefined(`Target message should be defined`);
    expect(source).toBeDefined(`Source message should be defined`);
    expect(target.fromUserId).toBe(source.fromUserId, `Message fromUserId should be same`);
    expect(target.toUserId).toBe(source.toUserId, `Message toUserId should be same`);
    expect(target.isRead).toBe(source.isRead, `Message isRead should be same`);
    expect(target.text).toBe(source.text, `Message text should be same`);
}

module.exports = {
    expectUsersAreEqual,
    expectUserWithoutPassword,
    expectFriendshipsAreEqual,
    expectMessagesAreEqual,
};
