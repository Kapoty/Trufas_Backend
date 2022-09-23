var express = require('express');
var app = express();
var cors = require('cors');
var logger = require('./logger');
var bodyParser = require('body-parser');

global.__root   = __dirname + '/'; 

var usersRoute = require(__root + 'routes/users');

/* Logger */

function errorLogger(error, req, res, next) {
	logger.error(error);
	next(error);
}

function errorResponder(error, req, res, next) {
	res.status(500).send({error: error.message});
}

/* No cors */

app.use(cors());

/* Json */

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '50mb'}));

/* Routes */

app.use('/api/users', usersRoute);

/* Static folder */

app.use('/static', express.static(__dirname + '/static'));

/* Logger */

app.use(errorLogger);
app.use(errorResponder);

module.exports = app;