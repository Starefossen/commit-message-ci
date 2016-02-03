'use strict';

const assert = require('assert');
const mongoose = require('mongoose');

const mongo = require('../../lib/db');
const redis = require('../../lib/redis');
const github = require('../../lib/github');

module.exports.github = {};

before(function mockGitHubClient() {
  github.client = function githubClientSpy() { return module.exports.github; };
});

before(function setupDBConn(done) {
  // Remove any pre-existing models
  // Automattic/mongoose#1251
  mongoose.models = {};
  mongoose.modelSchemas = {};

  if (mongo.connection._hasOpened) {
    process.nextTick(done);
  } else {
    mongo.connection.once('open', done);
  }
});

before(function setupRedisConn(done) {
  if (redis.status === 'connect') {
    return done();
  }

  redis.on('ready', done);
});

beforeEach(function dropDatabase(done) {
  mongo.connection.db.dropDatabase(done);
});

beforeEach(function createDummyData(done) {
  const User = require('../../apps/auth/model').User;
  const App = require('../../apps/app/model').App;

  new User({
    userId: process.env.TEST_USER_ID,
    userName: process.env.TEST_USER_NAME,
    email: process.env.TEST_USER_EMAIL,
    fullName: 'Test Tester',
    accessToken: process.env.TEST_USER_TOKEN,
    admin: true,
  }).save(function userSaveCb(mongoErr1, user) {
    assert.ifError(mongoErr1);

    new App({
      name: process.env.TEST_APP_NAME,
      desc: 'Test Desc',
      repo: process.env.TEST_APP_NAME.split('/')[1],
      owner: process.env.TEST_APP_NAME.split('/')[0],
      convention: 'AngularJS',
      users: [user._id],
      apiUser: user._id,
    }).save(function appSaveCb(mongoErr2) {
      assert.ifError(mongoErr2);

      const key = process.env.SESS_KEY;
      const data = JSON.stringify({
        cookie: {
          originalMaxAge: null,
          expires: null,
          httpOnly: true,
          path: '/',
        },
        auth: user,
      });

      redis.set(key, data, done);
    });
  });
});
