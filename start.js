const app = require('./app');
const db = require('./models');
const longPoll = require('./long-poll');

const port = process.env.PORT || 3000;

console.log(">>> ENV", process.env.NODE_ENV);

// db.sequelize.sync({ force: true }).then(() => {
db.sequelize.sync({ force: true }).then(() => {
    app.listen(port, function() {
        console.log('Listening on port ' + port);
    });

    longPoll.setup(app);
});