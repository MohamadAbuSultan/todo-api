'use strict';

const express = require('express');
const path = require('node:path');
const { createTodoRouter } = require('./api/todo.routes');
const { LocalStorageTodoRepository } = require('./repositories/local-storage-todo-repository');
const { TodoService } = require('./services/todo.service');

/**
 * Build the service used when the caller does not inject one.
 * The Web Storage repository keeps the items in memory and writes them
 * through to storage when the runtime provides and is configured for it, so
 * a plain start stays memory-only and a configured start restores the items.
 * @returns {TodoService}
 */
function createDefaultTodoService() {
  return new TodoService({ repository: new LocalStorageTodoRepository() });
}

/**
 * Create a configured Express application.
 * @param {{ todoService?: TodoService, logger?: Console }} [options]
 * @returns {{ app: import('express').Express, todoService: TodoService }}
 */
function createApp({ todoService = createDefaultTodoService(), logger = console } = {}) {
  const app = express();

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  app.use(express.json());

  app.use(express.static(path.join(__dirname, '../public')));

  app.use(createTodoRouter({ service: todoService, logger }));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler: keeps responses structured and prevents leaks.
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;

    if (statusCode >= 500) {
      logger.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(statusCode).json({ error: error.message });
  });

  return { app, todoService };
}

const { app } = createApp();

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, () => {
    console.log(`Todo API server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = { createApp, app };
