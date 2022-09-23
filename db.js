const mysql = require('mysql');
const logger = require('./logger');
const config = require('./db-config');

var db = module.exports = {
	conn: null
};

function handleDisconnect() {
	db.conn = mysql.createConnection(config);  // Recreate the connection, since the old one cannot be reused.
	db.conn.connect( function onConnect(err) {   // The server is either down
		if (err) {                                  // or restarting (takes a while sometimes).
			logger.error('error when connecting to db:'+ err.code);
			setTimeout(handleDisconnect, 10000);    // We introduce a delay before attempting to reconnect,
		} else                                          // to avoid a hot loop, and to allow our node script to
		console.log("connected to db");
	});                                             // process asynchronous requests in the meantime.
													// If you're also serving http, display a 503 error.
	db.conn.on('error', function onError(err) {
		logger.error('db error' + err.code);
		if (err.code == 'PROTOCOL_CONNECTION_LOST' || err.code == 'ECONNRESET') {   // Connection to the MySQL server is usually
			handleDisconnect();                         // lost due to either server restart, or a
		}                                       // connnection idle timeout (the wait_timeout
												// server variable configures this)
	});
}

handleDisconnect();

module.exports.mysqlEscape = function(stringToEscape) {
	if (typeof stringToEscape == 'number')
		stringToEscape = stringToEscape.toString();

	if(stringToEscape == '') {
		return stringToEscape;
	}

	if (!(typeof stringToEscape === 'string' || stringToEscape instanceof String)) {
		return '';
	}

	return stringToEscape
		.replace(/\\/g, "\\\\")
		.replace(/\'/g, "\\\'")
		.replace(/\"/g, "\\\"")
		.replace(/\n/g, "\\\n")
		.replace(/\r/g, "\\\r")
		.replace(/\x00/g, "\\\x00")
		.replace(/\x1a/g, "\\\x1a");
}