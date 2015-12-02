'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);

const github = require('../../lib/github');

const owner = process.env.TEST_APP_NAME.split('/')[0];
const repo = process.env.TEST_APP_NAME.split('/')[1];

beforeEach(function beforeEach() {
  github.client().repos = {
    getCommits: function gitHubGetCommitsMock() {
      throw new Error('github.repos.getCommits() is not implemented');
    },
    getCommit: function gitHubGetCommitMock() {
      throw new Error('github.repos.getCommit() is not implemented');
    },
  };

  github.client().statuses = {
    get: function gitHubGetStatusMock(msg, cb) {
      process.nextTick(cb.bind(null, null, []));
    },
  };
});


describe('GET /app', function describe() {
  const url = `/app`;

  it('redirects to login for unauthenticated user', function it(done) {
    req.get(url)
     .expect(302)
     .expect('Location', '/login', done);
  });

  it('returns my applications', function it(done) {
    req.get(url)
      .set('Cookie', process.env.SESS_COOKIE)
      .expect(200, done);
  });
});


describe('ALL /app/new', function describe() {
  const url = `/app/new`;

  before(function before() {
    github.client().getAllRepos = function getAllReposMock(cb) {
      process.nextTick(cb.bind(null, null, [
        'foo/bar',
        'for/baz',
        'bar/foo',
      ]));
    };
  });

  it('redirects to login for unauthenticated user', function it(done) {
    req.get(url)
     .expect(302)
     .expect('Location', '/login', done);
  });

  it('returns new application form', function it(done) {
    req.get(url)
      .set('Cookie', process.env.SESS_COOKIE)
      .expect(200, done);
  });
});

describe('GET /app/:owner/:repo', function describe() {
  const url = `/app/${owner}/${repo}`;

  it('redirects to login for unauthenticated user');
  it('redirects to my apps for unautorized user');

  it('returns application', function it(done) {
    github.client().repos.getCommits = function gitHubGetCommitsSpy(msg, cb) {
      cb(null, [{
        sha: '28f497509b8e2f7ff75d48de83303dcc969cd6de',
        commit: {
          author: null,
          commiter: null,
          message: 'Foobar',
          tree: null,
          url: '',
          comment_count: 0,
        },
        parents: [null],
      }]);
    };

    req.get(url)
      .set('Cookie', process.env.SESS_COOKIE)
      .expect(200, done);
  });
});

describe('GET /app/:owner/:repo/:sha', function describe() {
  const url = `/app/${owner}/${repo}`;
  const urlValid = `${url}/28f497509b8e2f7ff75d48de83303dcc969cd6de`;
  const urlInvalid = `${url}/28f497509b8e2f7ff75d48de83303dcc969cd6dd`;
  const urlUnknown = `${url}/28f497509b8e2f7ff75d48de83303dcc969cd6df`;

  beforeEach(function() {
    github.client().repos.getCommit = function gitHubGetCommitMock(msg, cb) {
      if (msg.sha === '28f497509b8e2f7ff75d48de83303dcc969cd6df') {
        const err = new Error(JSON.stringify({
          message: 'Not Found',
          documentation_url: 'https://developer.github.com/v3',
        }));

        err.code = 404;

        process.nextTick(cb.bind(null, err));
      } else {
        if (msg.sha === '28f497509b8e2f7ff75d48de83303dcc969cd6de') {
          msg.msg = 'feat(scope): some valid message';
        } else {
          msg.msg = 'Some invalid message';
        }

        process.nextTick(cb.bind(null, null, {
          sha: msg.sha,
          commit: {
            author: null,
            commiter: null,
            message: msg.msg,
            tree: null,
            url: '',
            commmet_count: 0,
          },
        }));
      }
    };
  });

  it('redirects from non-existing commit sha', function it(done) {
    req.get(urlUnknown)
      .expect(404)
      .expect('Location', `/app/${owner}/${repo}`, done);
  });

  it('shows valid commit status for unauthenticated user', function it(done) {
    req.get(urlValid)
      .expect(200)
      .expect('X-Commit-Message', 'true', done);
  });

  it('shows invvalid commit status for unauthenticated user', function it(done) {
    req.get(urlInvalid)
      .expect(200)
      .expect('X-Commit-Message', 'false', done);
  });

  it('shows commit status for authenticated user', function it(done) {
    req.get(urlValid)
      .set('Cookie', process.env.SESS_COOKIE)
      .expect(200)
      .expect('X-Commit-Message', 'true', done);
  });
});
