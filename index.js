/* eslint no-console: 0, no-unused-vars: 0 */
'use strict';

const express = require('express');
const statics = express.static;
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const db = require('./lib/db');

const app = module.exports.app = express();
app.set('x-powered-by', false);
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/static', statics(`${__dirname}/static`));
app.use('/themes', statics(`${__dirname}/node_modules/semantic-ui-less/themes`));

module.exports.nunjucks = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production',
});

app.use(require('./apps/auth/session'));
app.use(require('./apps/auth/middleware'));
app.use('/', require('./apps/auth/controller'));
app.use('/app', require('./apps/app/controller'));
app.use('/page', require('./apps/page/controller'));

// Redirect to /app
app.get('/', function getIndex(req, res) {
  res.redirect('/app');
});

// Error Handler
app.use(function errorHandler(err, req, res, next) {
  err.code = err.code || 500;

  if (err.code >= 500) {
    console.error(err);
    console.error(err.stack);
  }

  res.status(err.code || 500);
  res.send(err.message);
});

if (!module.parent) {
  app.listen(8080);
  db.connection.once('open', function dbOnceOpen() {
    console.log('Express started on port 8080');
  });
}
