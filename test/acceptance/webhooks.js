'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);

const github = require('../../lib/github');
const assert = require('assert');

const owner = process.env.TEST_APP_NAME.split('/')[0];
const repo = process.env.TEST_APP_NAME.split('/')[1];

describe('/webhook', function describe() {
  const clientOrg = github.client;
  const url = `/app/${owner}/${repo}/webhook`;

  const commit = {commits: [{
    id: '5e16ac67000c9672cb932cc06c9ae170496d5997',
    message: 'perf(pencil): remove graphiteWidth option',
  }]};

  const commits = {commits: [{
    id: '5e16ac67000c9672cb932cc06c9ae170496d5997',
    message: 'perf(pencil): remove graphiteWidth option',
  }, {
    id: '02d4aca0fd88aa3341d5f0fa36f79366d2d12e4e',
    message: 'fix(graphite): stop graphite breaking when width < 0.1',
  }]};

  let client;

  beforeEach(function beforeEach() {
    client = {
      statuses: {
        create: function githubCreateStatus() {
          throw new Error('github.statuses.create() not implemented');
        },
      },
    };

    github.client = function githubClientSpy() {
      return client;
    };
  });

  after(function after() {
    github.client = clientOrg;
  });

  it('reports failure for single valid commit', function it(done) {
    client.statuses.create = function githubCreateStatusSpy(msg) {
      assert.equal(msg.user, owner);
      assert.equal(msg.repo, repo);
      assert.equal(msg.sha, '5e16ac67000c9672cb932cc06c9ae170496d5997');
      assert.equal(msg.state, 'success');
      assert.equal(msg.description, 'Commit message is valid');
      assert.equal(msg.context, 'git-commit/message');

      process.nextTick(done);
    };

    req.post(url).send(commit).expect(200, function reqPostCb(err) {
      assert.ifError(err);
    });
  });

  it('reports failure for single invalid commit', function it(done) {
    client.statuses.create = function githubCreateStatusSpy(msg) {
      assert.equal(msg.user, owner);
      assert.equal(msg.repo, repo);
      assert.equal(msg.sha, '5e16ac67000c9672cb932cc06c9ae170496d5997');
      assert.equal(msg.state, 'failure');
      assert.equal(msg.description, [
        '"SOAP is a piece of shit"',
        'does not match',
        '"<type>(<scope>): <subject>"!',
      ].join(' '));
      assert.equal(msg.context, 'git-commit/message');

      process.nextTick(done);
    };

    // http://whatthecommit.com/bcaac21b6e275091a09e365628377bf2
    commit.commits[0].message = 'SOAP is a piece of shit';

    req.post(url).send(commit).expect(200, function reqPostCb(err) {
      assert.ifError(err);
    });
  });

  it('reports status for multiple valid commits', function it(done) {
    let i = 0;

    client.statuses.create = function githubCreateStatusSpy(msg, cb) {
      assert.equal(msg.state, 'success');

      // normal callback until the last commit
      if (++i < commits.commits.length) {
        process.nextTick(cb.bind(null, null));
      } else {
        process.nextTick(done);
      }
    };

    req.post(url).send(commits).expect(200, function reqPostCb(err) {
      assert.ifError(err);
    });
  });

  it('reports status for multiple mixed commits', function it(done) {
    let i = 0;

    client.statuses.create = function githubCreateStatusSpy(msg, cb) {
      assert.equal(msg.state, ++i === 1 ? 'success' : 'failure');

      // normal callback until the last commit
      if (i < commits.commits.length) {
        process.nextTick(cb.bind(null, null));
      } else {
        process.nextTick(done);
      }
    };

    // http://whatthecommit.com/9e7c6cba3d5a056463c8c0f2656bbc67
    commits.commits[1].message = 'So my boss wanted this button ...';

    req.post(url).send(commits).expect(200, function reqPostCb(err) {
      assert.ifError(err);
    });
  });
});
