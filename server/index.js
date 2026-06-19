const { app, initApp, pool } = require('./app');

const port = process.env.PORT || 8000;

if (require.main === module) {
  initApp()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });

  process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
  });
}

module.exports = app;
