'use strict';

const router = require('express').Router;
const app = router();

const pages = new Set([
  'about',
]);

app.param('page', function paramPage(req, res, next, page) {
  if (!pages.has(page)) {
    const err = new Error('Page Not Found');
    err.code = 404;
    return next(err);
  }

  return next();
});

app.get('/:page', function getPage(req, res) {
  res.render(`page/${req.params.page}.html`, {
    req: req,
  });
});

module.exports = app;
