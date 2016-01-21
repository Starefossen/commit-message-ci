'use strict';

const supertest = require('supertest');
const req = supertest(require('../../').app);

describe('GET /favicon.ico', function describe() {
  const url = '/favicon.ico';

  it('returns about page', function it(done) {
    req.get(url)
      .expect('Content-Type', 'image/x-icon')
      .expect(200, done);
  });
});
