'use strict';

const Client = require('github');
const async = require('async');
const redis = require('./redis');

Client.prototype.getAllRepos = function getAllRepos(cb) {
  const cacheKey = `repos:${this._user.userName}`;
  const cacheTtl = 86400; // 60 * 60 * 24
  const client = this;

  const opts = { per_page: 100, page: 0 };
  const ret = [];
  let count;

  redis.lrange(cacheKey, 0, -1, function getCacheRepos(redisErr, redisRepos) {
    if (redisErr || redisRepos.length) { return cb(redisErr, redisRepos); }

    async.doWhilst(function doWhilstFn(next) {
      client.repos.getAll(opts, function githubReposGetAll(githubErr, githubRepos) {
        if (githubErr) { return next(githubErr); }

        count = githubRepos.length;

        githubRepos.forEach(function reposForEach(repo) {
          if (repo.full_name) {
            ret.push(repo.full_name);
          }
        });

        next();
      });
    }, function doWhilstTest() {
      opts.page++;
      return count === 100;
    }, function doWhilstCallback(err) {
      redis.del(cacheKey);
      redis.rpush(cacheKey, ret);
      redis.expire(cacheKey, cacheTtl);

      cb(err, ret);
    });
  });
};

exports.client = function githubClient(user) {
  const client = new Client({
    version: '3.0.0',
    debug: process.env.GITHUB_DEBUG === 'true',
  });

  client.authenticate({
    type: 'oauth',
    token: user.accessToken,
  });

  client._user = user;

  return client;
};
