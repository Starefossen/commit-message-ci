# Git Commit Message CI

General purpose continuous integration (CI) server to validate commit message
formatting for pull requests.

![Valid Commit Message](https://raw.githubusercontent.com/Starefossen/commit-message-ci/master/static/images/about/valid.png)

## Features

* Validate commit message formatting
* Single sign on with GitHub authentication
* Public and private repositories
* GitHub pull request commit status integration

## Development

### Prerequisite

* Docker > 1.8
* Docker Compose > 1.5

### Environment

Put these environment variables in you `.env.dev` file.

* `APP_SECRET` - Random Session Secret

**GitHub OAuth**

* `GH_OAUTH_CLIENT`
* `GH_OAUTH_SECRET`
* `GH_OAUTH_RANDOM` - Random OAuth Secret

**GitHub Test Repo**

* `TEST_APP_NAME` - Repo Name (`user/repo`)
* `TEST_APP_DESC` - Repo Description

**GitHub Test User**

* `TEST_USER_ID`
* `TEST_USER_NAME`
* `TEST_USER_EMAIL`
* `TEST_USER_TOKEN` - OAuth Access Token

### Test

```
docker-compose run --rm dev npm test
```

## [MIT Licensed](https://github.com/Starefossen/commit-message-ci/blob/master/LICENSE)
