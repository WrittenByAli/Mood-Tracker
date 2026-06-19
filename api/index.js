const { app, initApp } = require('../server/app');

const ready = initApp();

module.exports = async (req, res) => {
  await ready;
  return app(req, res);
};
