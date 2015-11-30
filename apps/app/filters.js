'use strict';

const moment = require('moment');

module.exports.shorten = function appFilterShorten(str, count) {
  return str.slice(0, count || 5);
};

module.exports.nl2br = function appFilterNl2br(str) {
  return str.replace(/\n/g, '<br>');
};

module.exports.format = function appFilterFormat(str, format) {
  return moment(str).format(format);
};

module.exports.since = function appFilterFormat(str) {
  return moment(str).fromNow();
};
