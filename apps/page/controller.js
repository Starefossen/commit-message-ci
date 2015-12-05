'use strict';

const router = require('express').Router;
const app = router();

const HttpError = require('@starefossen/node-http-error');

const pages = new Set([
  'about',
]);

app.param('page', function paramPage(req, res, next, page) {
  if (!pages.has(page)) {
    return next(new HttpError(`Page "${page}" does not exist`, 404));
  }

  return next();
});

app.get('/:page', function getPage(req, res) {
  res.render(`page/${req.params.page}.html`, {
    req: req,
  });
});

module.exports = app;
