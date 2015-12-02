'use strict';

const assert = require('assert');
const commit = require('../../lib/commit');

describe('commit', function describeCommit() {
  describe('#validateMessage()', function describeValidateMessage() {
    it('returns error for missing commit message type', function it() {
      const message = '($browser): onUrlChange event (popstate/hashchange/polling)';
      const error = commit.validateMessage(message);

      assert(/does not match "<type>\(<scope>\): <subject>"/.test(error));
    });

    it('returns error for invalid commit message type', function it() {
      const message = 'foo($browser): onUrlChange event (popstate/hashchange/polling)';
      const error = commit.validateMessage(message);

      assert(/type "foo" is not allowed/.test(error));
    });

    it('accepts optinal commit message scope', function it() {
      const message = 'feat($browser): onUrlChange event (popstate/hashchange/polling)';
      const error = commit.validateMessage(message);

      assert.ifError(error);
    });

    it('retruns error for missing commit mesage message', function it() {
      const message = 'feat($browser)';
      const error = commit.validateMessage(message);

      assert(/does not match "<type>\(<scope>\): <subject>"/.test(error));
    });

    it('returns error for capitalized commit message message', function it() {
      const message = 'feat($browser): OnUrlChange event (popstate/hashchange/polling)';
      const error = commit.validateMessage(message);

      assert(/does not match "<type>\(<scope>\): <subject>"/.test(error));
    });

    it('returns error for commit message longer than 100 char', function it() {
      const message = [
        'feat($browser): OnUrlChange event (popstate/hashchange/polling)',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec',
        'a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula',
        'ac quam viverra nec consectetur ante hendrerit.',
      ].join(' ');
      const error = commit.validateMessage(message);

      assert(/does not match "<type>\(<scope>\): <subject>"/.test(error));
    });

    it('returns null for valid commit message', function it() {
      [
        'feat($browser): onUrlChange event (popstate/hashchange/polling)',
        'fix($compile): couple of unit tests for IE9',
        'feat(directive): ng:disabled, ng:checked, ng:multiple, ng:readonly, ng:selected',
        'style($location): add couple of missing semi colons',
        'docs(guide): updated fixed docs from Google Docs',
        'feat($compile): simplify isolate scope bindings',
      ].forEach(function messagesForEach(message) {
        assert.equal(commit.validateMessage(message), null);
      });
    });
  });
});
