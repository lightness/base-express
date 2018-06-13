const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');

const jwtHelper = require('./helpers/jwt');

const app = express();

app.set('views', __dirname + '/views');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(
    jwt({ secret: jwtHelper.secret }).unless({
        path: ['/user/login', '/user/register'],
    }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./controllers'));

module.exports = app;
