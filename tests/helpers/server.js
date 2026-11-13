'use strict';

const { once } = require('node:events');
const { createApp } = require('../../src/app');

const silentLogger = {
  info() {},
  error() {},
};

/**
 * Start the Express app on an ephemeral port for tests.
 * @returns {Promise<{
 *   baseUrl: string,
 *   todoService: import('../../src/services/todo.service').TodoService,
 *   close: () => Promise<void>
 * }>}
 */
async function startTestServer() {
  const { app, todoService } = createApp({ logger: silentLogger });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    todoService,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

module.exports = { startTestServer };
