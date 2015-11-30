'use strict';

const Schema = require('../../lib/db').Schema;
const db = require('../../lib/db');

const userSchema = new Schema({
  userId: Number,
  userName: String,
  email: String,
  fullName: String,
  created: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  accessToken: String,
  refreshToken: String,
  avatarUrl: String,
  admin: { type: Boolean, default: false },
});

module.exports = {
  User: db.model('User', userSchema),
};
