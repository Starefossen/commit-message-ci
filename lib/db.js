'use strict';

const mongoose = require('mongoose');

if (mongoose.connection._hasOpened) {
  module.exports = mongoose;
} else {
  if (!process.env.MONGO_DB) {
    throw new Error('Environment variable "MONGO_DB" is undefined');
  }

  const addr = process.env.MONGO_PORT_27017_TCP_ADDR;
  const port = process.env.MONGO_PORT_27017_TCP_PORT;
  const db = process.env.MONGO_DB;

  module.exports = mongoose.connect(`mongodb://${addr}:${port}/${db}`);
  module.exports.connection.on('error', function dbOnError(err) {
    throw err;
  });
}
