require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  if (typeof app.onReady === 'function') {
    await app.onReady();
  }

  const server = app.listen(PORT, () => {
    logger.info(`SKYLA server running on port ${PORT}`);
    logger.info(`API docs: http://localhost:${PORT}/api/docs`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${PORT} is already in use. Stop the other process (e.g. taskkill /PID <pid> /F) or set PORT in .env.`
      );
      process.exit(1);
    }
    throw err;
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
