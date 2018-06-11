let express = require('express');
let bodyParser = require('body-parser');
let jwt = require('express-jwt');

let db = require('./models');
let jwtHelper = require('./helpers/jwt');

let app = express();
let port = process.env.PORT || 3000;

app.set('views', __dirname + '/views');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(
    jwt({ secret: jwtHelper.secret }).unless({ path: ['/user/login', '/user/register'] }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./controllers'));

// { force: true }
db.sequelize.sync().then(() => {
    app.listen(port, function() {
        console.log('Listening on port ' + port);
    });
});
