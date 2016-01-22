'use strict';

const Schema = require('../../lib/db').Schema;
const db = require('../../lib/db');

const github = require('../../lib/github');
const validateCommit = require('../../lib/commit').validateMessage;

const appSchema = new Schema({
  name: String,
  updated: { type: Date, default: Date.now },
  desc: String,
  repo: String,
  owner: String,
  convention: { type: String, enum: ['AngularJS'], required: '{PATH} is required' },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  apiUser: { type: Schema.Types.ObjectId, ref: 'User' },
});

appSchema.methods.github = function appGithubClient() {
  return github.client(this.apiUser);
};

appSchema.methods.validateCommit = function appValidateCommit(commit, opts, cb) {
  let error = validateCommit(commit.message);

  if (opts.valid === true) {
    error = null;
  }

  if (opts.valid === false) {
    error = new Error('Commit message is invalid');
  }

  const msg = {
    user: this.owner,
    repo: this.repo,
    sha: commit.id,
    state: error ? 'failure' : 'success',
    description: error ? error.message : 'Commit message is valid',
    context: 'git-commit/message',
    target_url: `${opts.appUrl}/${commit.id}`,
  };

  if (!opts.send) {
    return process.nextTick(function processNextTickCb() {
      cb(null, !error, error ? error.message : null);
    });
  }

  this.github().statuses.create(msg, function githubCreateStatusCb(err) {
    cb(err, !error, error ? error.message : null);
  });
};

module.exports = {
  App: db.model('App', appSchema),
};
