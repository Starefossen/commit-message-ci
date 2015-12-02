'use strict';

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

module.exports = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.APP_SECRET,
  secure: process.env.NODE_ENV === 'production',
  store: new RedisStore({host: 'redis'}),
});
