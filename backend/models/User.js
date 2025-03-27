const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'regular'], default: 'regular' }, // Ensure role is defined
});

const User = mongoose.model('User', UserSchema);
module.exports = User;