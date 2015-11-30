'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);

const github = require('../../lib/github');

const owner = process.env.TEST_APP_NAME.split('/')[0];
const repo = process.env.TEST_APP_NAME.split('/')[1];

beforeEach(function beforeEach() {
  github.client().repos = {
    getCommits: function gitHubGetCommitsSpy() {
      throw new Error('github.repos.getCommits() not implemented');
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

describe.skip('GET /app/:owner/:repo', function describe() {
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
