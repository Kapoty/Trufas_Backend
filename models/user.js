const db = require('../db');

module.exports.getUserByLogin = function (login, callback) {
	db.conn.query(`SELECT id, password FROM users WHERE username = '${db.mysqlEscape(login.toLowerCase())}' AND active = 1;`, (error, results, fields) => {
		if (error) return callback(error.code)
		if (results.length < 1) return callback("no user matches given login")
		else callback(null, results[0]);
	});
}

module.exports.getUserForVerify = function (userId, callback) {
	db.conn.query(`SELECT id FROM users WHERE id = '${db.mysqlEscape(userId)}' AND active = 1;`, (error, results, fields) => {
		if (error) return callback(error.code)
		if (results.length < 1) return callback("no user matches given id")
		else callback(null, results[0]);
	});
}

module.exports.getUserProfile = function (userId, callback) {
	db.conn.query(`SELECT username, profiles.* FROM users LEFT JOIN profiles ON profiles.id = users.profile_id WHERE users.id = ${db.mysqlEscape(userId)};`, (error, results, fields) => {
		if (error) return callback(error.code)
		if (results.length < 1) return callback("no user matches given id")
		else callback(null, results[0]);
	});
}

module.exports.getUsersList = function (callback) {
	db.conn.query(`SELECT users.id, users.username, users.profile_id, profiles.name AS profile_name, users.active
					FROM users LEFT JOIN profiles ON profiles.id = users.profile_id
					WHERE 1 ORDER BY users.active DESC, users.profile_id ASC, users.id ASC;`, (error, results, fields) => {
		if (error) callback(error.code)
		else callback(null, results);
	});
}

module.exports.setUserActive = function (userId, value, callback) {
    db.conn.query(`UPDATE users SET active = '${(value)?1:0}' WHERE id = '${db.mysqlEscape(userId)}'`, (error) => {
        if (error) return callback(false)
        else return callback(true);
    });
}

module.exports.addUser = function (username, password, profile_id, callback) {
	db.conn.query(`
			INSERT INTO users(username, password, profile_id, active)
			VALUES ('${db.mysqlEscape(username)}', '${db.mysqlEscape(password)}', '${db.mysqlEscape(profile_id)}', 1);
	   `, (error, results, fields) => {
		if (error) return callback(error)
		if (results.length < 1) return callback({code: 'UNEXPECTED', message: "unexpected"})
		else callback(null, results.insertId);
	});
}

module.exports.updateUserPassword = function (userId, password, callback) {
	db.conn.query(`UPDATE users SET password='${db.mysqlEscape(password)}'
	 WHERE id = '${db.mysqlEscape(userId)}'`, (error, results, fields) => {
		if (error) return callback(error.code)
		if (results.affectedRows == 0) return callback('unexpected error');
		else callback(null, results);
	});
}

module.exports.validateUsername = function (username) {
	if (username == null || String(username).length < 4)
		return "username too short";
	if (String(username).length > 12)
		return "username too long";
	if (!/^[a-z][a-z0-9_]*$/.test(String(username)))
		return "username invalid";
	return null;
}

module.exports.validatePassword = function (password) {
	if (password == null || String(password).length < 8)
		return "password too short";
	if (String(password).length > 15)
		return "password too long";
	if (!/^[A-Za-z0-9_@]+$/.test(String(password)))
		return "password invalid";
	return null;
}

module.exports.validateProfileId = function (profile_id) {
	if (profile_id == null || isNaN(parseInt(profile_id)) || profile_id < 1 || profile_id > 2)
		return "profile invalid";
	return null;
}