/* eslint no-console: 0*/
'use strict';

const router = require('express').Router;
const User = require('./model').User;
const app = router();

const redis = require('../../lib/redis');
const github = require('../../lib/github');
const OAuth2 = require('oauth').OAuth2;
const oauth2 = new OAuth2(
  process.env.GH_OAUTH_CLIENT,
  process.env.GH_OAUTH_SECRET,
  'https://github.com/',
  'login/oauth/authorize',
  'login/oauth/access_token',
  null
); /** Custom headers */

app.get('/login', function getLogin(req, res) {
  res.render('login.html', { req });
});

app.get('/logout', function getLogout(req, res) {
  redis.del(`repos:${req.session.auth.userName}`);
  req.session.destroy(function sessionDestroyCb() {
    res.redirect('/');
  });
});

app.get('/login/github', function getLoginGitHub(req, res) {
  const originalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const authURL = oauth2.getAuthorizeUrl({
    redirect_uri: `${originalUrl}/callback`,
    scope: 'repo,user',
    state: process.env.GH_OAUTH_RANDOM,
  });

  res.redirect(authURL);
});

app.get('/login/github/callback', function getLoginGitHubCallback(req, res, next) {
  const originalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // @TODO validate req.query.state ?
  // @TODO req.query.error + req.query.error_description
  if (req.query.error) {
    console.log('/login/github/callback');
    console.log('error', req.query.error);
    console.log('error_description', req.query.error_description);
  }

  oauth2.getOAuthAccessToken(
    req.query.code,
    { redirect_uri: originalUrl },
    function getOAuthAccessTokenCb(err, accessToken, refreshToken, results) {
      if (err) { return next(err); }
      if (results.error) { return next(results.error); }

      const userData = { accessToken, refreshToken };

      github.client(userData).user.get({}, function githubUserGetCb(githubErr, data) {
        if (githubErr) { return next(githubErr); }

        userData.userId = data.id;
        userData.userName = data.login;
        userData.email = data.email;
        userData.fullName = data.name;
        userData.lastLogin = Date.now();
        userData.accessToken = accessToken;
        userData.refreshToken = refreshToken;
        userData.avatarUrl = data.avatar_url;

        const opts = { new: true, upsert: true };
        const query = { userId: data.id };

        User.findOneAndUpdate(query, userData, opts, function userFindAndUpdateCb(userErr, user) {
          if (userErr) { return next(userErr); }

          req.session.auth = user;
          res.redirect('/');
        });
      });
    });
});

module.exports = app;
