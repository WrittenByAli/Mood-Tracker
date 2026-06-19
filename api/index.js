const { app, initApp } = require('../server/app');

let ready = initApp().catch((err) => {
  console.error('Database initialization failed:', err.message);
  return null;
});

module.exports = async (req, res) => {
  const path = req.url?.split('?')[0] || '';
  if (path === '/api/health') {
    return app(req, res);
  }

  await ready;
  return app(req, res);
};
