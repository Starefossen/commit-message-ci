const Redis = require('ioredis');

module.exports = new Redis(6379, 'redis');
