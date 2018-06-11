let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    port = process.env.PORT || 3000,
    db = require('./models');

app.set('views', __dirname + '/views');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./controllers'));

// { force: true }
db.sequelize.sync().then(() => {
    app.listen(port, function() {
        console.log('Listening on port ' + port);
    });
});
