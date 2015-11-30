/* eslint no-unused-vars: 0 */
'use strict';

const router = require('express').Router;
const commit = require('../../lib/commit');

const app = router();
const App = require('./model').App;
const User = require('../auth/model').User;

const filters = require('./filters');
const async = require('async');

if (module.parent.exports.nunjucks) {
  for (const filter in require('./filters')) {
    // if-check to make eslint stop complaining!
    if (/^\w+$/.test(filter)) {
      module.parent.exports.nunjucks.addFilter(filter, filters[filter]);
    }
  }
}

app.get('/', function getApps(req, res, next) {
  const query = {
    users: req.session.auth._id,
  };

  App.find(query).sort({updated: -1}).exec(function appFindCb(err, apps) {
    if (err) { return next(err); }

    res.render('app/index.html', {
      req: req,
      apps: apps,
    });
  });
});

app.all('/new', function allNew(req, res, next) {
  function render(data, appErr) {
    req.github.getAllRepos(function getAllReposCb(err, repos) {
      if (err) { return next(err); }

      res.render('app/new.html', {
        app: data || {},
        err: appErr || null,
        repos: repos,
        req: req,
      });
    });
  }

  if (req.method === 'POST') {
    // @TODO(starefossen): /^\w+\/\w+$/.test(req.body.repo)

    const opts = {
      user: req.body.repo.split('/')[0],
      repo: req.body.repo.split('/')[1],
    };

    req.github.repos.get(opts, function gitHubReposGetCb(err, repo) {
      if (err) { return render(req.body, err); }

      // @TODO(starefossen): check repo.permissions
      // permissions: { admin: true, push: true, pull: true },
      // @TODO(starefossen): check if exists in database

      const appNew = new App({
        name: repo.full_name,
        desc: repo.description,
        repo: repo.name,
        owner: repo.owner.login,
        convention: req.body.convention,
        users: [req.session.auth._id],
        apiUser: req.session.auth._id,
      });

      appNew.save(function newAppSaveCb(appErr) {
        if (appErr) { return render(req.body, appErr); }

        opts.name = 'web';
        opts.events = ['push', 'pull_request'];
        opts.config = {
          url: `${req.protocol}://${req.headers.host}/app/${appNew.name}/webhook`,
          content_type: 'json',
        };

        req.github.repos.createHook(opts, function gitHubReposCreateHookCb(githubErr, hook) {
          // @TODO(starefossen): show error if hook creation failed
          // if (err) { return render(req.body, err); }

          return res.redirect(`/app/${appNew.name}`);
        });
      });
    });
  } else {
    render();
  }
});

app.param('repo', function paramAppId(req, res, next) {
  const query = {
    owner: req.params.owner,
    repo: req.params.repo,
  };

  App.findOne(query).populate(['apiUser', 'users']).exec(function appFindOneCb(err, repo) {
    if (err) { return next(err); }
    if (!repo) { return next(new Error(`Application "${repo}" was not found!`)); }

    req.repo = repo;
    next();
  });
});

app.get('/:owner/:repo', function getApp(req, res, next) {
  const opts = {
    user: req.repo.owner,
    repo: req.repo.repo,
  };

  req.repo.github().repos.getCommits(opts, function gitHubReposGetCommitsCb(err, commits) {
    if (err) { return next(err); }

    for (const c of commits) {
      c.valid = commit.validateMessage(c.commit.message) === null;
    }

    res.render('app/view.html', {
      commits: commits,
      app: req.repo,
      req: req,
    });
  });
});

app.all('/:owner/:repo/edit', function getAppEdit(req, res) {
  function render(err, users) {
    res.render('app/edit.html', {
      app: req.repo,
      users: users || req.repo.users,
      err: err || null,
      req: req,
    });
  }

  if (req.method === 'POST') {
    async.map(req.body.users.split(','), function usersAsyncEach(user, cb) {
      for (let i = 0; i < req.repo.users.length; i++) {
        if (req.repo.users[i]._id.toString() === user) { return cb(null, req.repo.users[i]); }
      }

      req.github.user.getFrom({user: user}, function gitHubUserGetCb(githubErr, data) {
        if (githubErr) { return cb(new Error(`User ${user} does not exist`)); }

        const newUser = {
          userId: data.id,
          userName: data.login,
          email: data.email,
          fullName: data.name,
          avatarUrl: data.avatar_url,
        };

        const opts = { new: true, upsert: true };
        const query = { userId: data.id };

        User.findOneAndUpdate(query, newUser, opts, cb);
      });
    }, function usersAsyncDone(err, users) {
      if (err) { return render(err); }

      req.repo.convention = req.body.convention;
      req.repo.users = users.map(function usersMap(u) { return u._id.toString(); });

      req.repo.save(function repoSaveCb(dbErr) {
        render(dbErr, users);
      });
    });
  } else {
    render();
  }
});

app.get('/:owner/:repo/delete', function getAppDelete(req, res, next) {
  // @TODO(starefossen): impelement delete confirmation via POST
  // @TODO(starefossen): remove web-hook

  App.remove({_id: req.repo._id}, function appRemoveCb(err) {
    if (err) { return next(err); }
    res.redirect('/app');
  });
});

app.post('/:owner/:repo/webhook', function getAppWebhook(req, res) {
  if (req.body && req.body.commits) {
    req.body.commits.forEach(function commitsForEach(c) {
      req.repo.validateCommit(c, {send: true}, function validateCommitCb(err) {
        if (err) { throw err; }
      });
    });
  }

  res.status(200).end();
});

app.param('sha', function paramAppShaCommit(req, res, next, sha) {
  const opts = {
    user: req.repo.owner,
    repo: req.repo.repo,
    sha: sha,
  };

  req.repo.github().repos.getCommit(opts, function gitHubReposGetCommitCb(err, c) {
    if (err) { return next(err); }

    req.commit = c;
    req.commit.valid = commit.validateMessage(c.commit.message) === null;
    req.commit.error = commit.validateMessage(c.commit.message) || null;

    next();
  });
});

app.all('/:owner/:repo/:sha', function getAppShaStatus(req, res, next) {
  const opts = {
    user: req.repo.owner,
    repo: req.repo.repo,
    sha: req.params.sha,
  };

  req.repo.github().statuses.get(opts, function gitHubStatusesGet(err, s) {
    if (err) { return next(err); }

    req.commit.statuses = s;

    next();
  });
});

app.get('/:owner/:repo/:sha', function getAppCommit(req, res) {
  res.render('app/commit.html', {
    c: req.commit,
    app: req.repo,
    req: req,
  });
});

app.post('/:owner/:repo/:sha', function postAppCommitStatus(req, res, next) {
  const data = {
    id: req.commit.sha,
    message: req.commit.commit.message,
  };

  const opts = { send: true };

  if (req.body.accept) { opts.valid = true; }
  if (req.body.reject) { opts.valid = false; }

  req.repo.validateCommit(data, opts, function validateCommitCb(err, valid, message) {
    if (err) { return next(err); }

    res.redirect(`/app/${req.repo.name}/${req.params.sha}`);
  });
});

module.exports = app;
