'use strict';
const app = require('./app');
const sequelize = require('./models/sequelize');
const longPoll = require('./long-poll');

const port = process.env.PORT || 3000;

console.log('>>> ENV', process.env.NODE_ENV);

// sequelize.sync({ force: true }).then(() => {
sequelize.sync({ force: true }).then(() => {
    app.listen(port, () => {
        console.log('Listening on port ' + port);
    });

    longPoll.setup(app);
});
