const mongoose = require('mongoose');
const User = require('./user');
const { ObjectId } = mongoose.Types;

const secretSchema = mongoose.Schema({
	secret: {
		type: String
	},
	createdBy: {
		type: ObjectId,
		ref: 'User'
	}
});

module.exports = mongoose.model('Secret', secretSchema);
