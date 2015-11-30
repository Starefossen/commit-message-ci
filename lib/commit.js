'use strict';

const MAX_LENGTH = 100;
const PATTERN = /^((\w+)(\(([^\)]+)\))?: ([^A-Z].+))(\n|$)/;
const IGNORED = /^WIP\:/;
const TYPES = new Set([
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'chore',
  'revert',
]);

module.exports.validateMessage = function validateMessage(message) {
  if (IGNORED.test(message)) {
    return null;
  }

  const match = PATTERN.exec(message);

  if (!match) {
    return new Error(`"${message}" does not match "<type>(<scope>): <subject>"!`);
  }

  const firstLine = match[1];
  const type = match[2];
  // const scope = match[4];
  // const subject = match[5];

  if (firstLine.length > MAX_LENGTH) {
    return new Error(`"${firstLine}" is longer than ${MAX_LENGTH} characters!`);
  }

  if (!TYPES.has(type)) {
    return new Error(`"${firstLine}" with type "${type}" is not allowed!`);
  }

  // Some more ideas, do want anything like this ?
  // - Validate the rest of the message (body, footer, BREAKING CHANGE annotations)
  // - allow only specific scopes (eg. fix(docs) should not be allowed ?
  // - auto correct the type to lower case ?
  // - auto correct first letter of the subject to lower case ?
  // - auto add empty line after subject ?
  // - auto remove empty () ?
  // - auto correct typos in type ?
  // - store incorrect messages, so that we can learn

  return null;
};
