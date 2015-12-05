'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);

describe('GET /page/about', function describe() {
  const url = '/page/about';

  it('returns about page', function it(done) {
    req.get(url).expect(200, done);
  });
});

describe('GET /page/notfound', function describe() {
  const url = '/page/notfound';

  it('returns 404 error', function it(done) {
    req.get(url).expect(404, done);
  });
});
