const dream = require('dreamjs');

dream.schema('user', {
    id: 'incrementalId',
    fullName: 'name',
    password: 'password',
    email: 'email',
});
