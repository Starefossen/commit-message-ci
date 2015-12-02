'use strict';

const github = require('../../lib/github');
// const User = require('./model').User;

module.exports = function authMiddleware(req, res, next) {
  if (!req.session.auth
      && !/^\/login/.test(req.originalUrl)
      && !/^\/app(\/[^\/]+){2}\/(webhook|[0-9a-f]{40})\/?$/.test(req.originalUrl)
  ) {
    return res.redirect('/login');
  }

  if (req.session.auth) {
    if (!req.session.auth.accessToken) {
      throw new Error(`Missing accessToken for user ${req.session.auth.userName}`);
    }

    req.github = github.client(req.session.auth);
  }

  next();
};
