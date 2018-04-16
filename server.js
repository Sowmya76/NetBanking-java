var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    jwt = require('jsonwebtoken'),
    session = require('client-sessions'),
    morgan = require('morgan');

var route = require('./routes/routes'),
    apiRouter = require('./routes/apirouters')
User = require('./models/user'),
    config = require('./config'),
    port = process.env.PORT || 8090;

mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    cookieName: 'session',
    secret: 'sowmya',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

app.use(morgan('dev'));

app.use('/api', apiRouter);
app.use('/setup', route)

app.get('/', (req, res) => {
    res.send('a bit more detailed shit, maybe?');
})

app.listen(port, '172.16.34.30');
console.log('http://localhost:' + port);