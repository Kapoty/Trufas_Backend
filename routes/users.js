const userModel = require ('../models/user');
const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../config'); 

const VerifyUserToken = require('../middlewares/VerifyUserToken');
const GetUserProfile = require('../middlewares/GetUserProfile');

router.post('/login', function(req, res) {

	let login = req.body.login;
	let password = req.body.password;

	if (login == null || login.length < 1)
		return res.status(500).send({error:"incorrect data"});
	if (password == null || password.length < 8)
		return res.status(500).send({error:"incorrect data"});

	userModel.getUserByLogin(login, (error, results) => {

		if (error)
			return res.status(500).send({error: "incorrect data"});

		let passwordIsValid = bcrypt.compareSync(password, results.password);

		if (!passwordIsValid)
			return res.status(200).send({error:"incorrect data"});

		let userToken = jwt.sign({ userId: results.id }, config.secret, {
			expiresIn: 86400 // expires in 24 hours
		});

		res.status(200).send({ userToken: userToken });
	});

});

router.get('/me/verify-token', VerifyUserToken, function(req, res) {
	res.status(200).send({auth: true});
});

router.get('/me/profile', VerifyUserToken, function(req, res) {
	userModel.getUserProfile(req.userId ,(error, results) => {
		if (error)
			return res.status(500).send({error: error});
		res.status(200).send({profile: results});
	});
});

router.get('/', VerifyUserToken, GetUserProfile, function(req, res) {
	if (req.userProfile['id'] != 1)
		return res.status(500).send({error: 'permission denied'});
	userModel.getUsersList((error, results) => {
		if (error)
			return res.status(500).send({error: error});
		res.status(200).send({users: results});
	});
});

router.post('/:userId/set-active', VerifyUserToken, GetUserProfile, function(req, res) {
	if (req.params.userId == 1 || req.params.userId == req.userId)
		return res.status(500).send({ error: true});
	userModel.setUserActive(req.params.userId, req.body.value, (success, results) => {
		if (!success)
			return res.status(500).send({ error: true});
		res.status(200).send({ error: false});
	});
});

router.post('/', VerifyUserToken, GetUserProfile, function(req, res) {
	if (req.userProfile['id'] != 1)
		return res.status(500).send({error: 'permission denied'});

	let username = String(req.body.username).toLowerCase();
	let password = req.body.password;
	let password_confirm = req.body.password_confirm;
	let profile_id = req.body.profile_id;

	let error;

	error = userModel.validateUsername(username);
	if (error != null) return res.status(500).send({error: error});

	error = userModel.validatePassword(password);
	if (error != null) return res.status(500).send({error: error});

	if (password_confirm == null || password_confirm !== password)
		return res.status(500).send({error: "password_confirm not match"});

	error = userModel.validateProfileId(profile_id);
	if (error != null) return res.status(500).send({error: error});

	userModel.addUser(String(username), bcrypt.hashSync(password, 8), profile_id, (error, results) => {

		if (error) {
			if (/(^ER_DUP_ENTRY)[\s\S]+('username'$)/g.test(error.message))
				return res.status(500).send({error: 'username duplicate'});
			return res.status(500).send({error: error.code});
		}
		res.status(200).send({ userId: results });
	});
});

router.post('/:id/update-password', VerifyUserToken, GetUserProfile, function(req, res) {
	if (req.userProfile['id'] != 1)
		return res.status(500).send({error: 'permission denied'});
	
	let password = req.body.password;
	let password_confirm = req.body.password_confirm;
	
	let error;

	error = userModel.validatePassword(password);
	if (error != null) return res.status(500).send({error: error});

	if (password_confirm == null || password_confirm !== password)
		return res.status(500).send({error: "password_confirm not match"});

	userModel.updateUserPassword(req.params.id, bcrypt.hashSync(password, 8), (error, results) => {
		if (error)
			return res.status(500).send({error: error});
		res.status(200).send({success: true});
	});
});

module.exports = router;