'use strict';

const express = require('express');
const { TodoService } = require('../services/todo.service');
const { validateTitle } = require('../utils/validation');

/**
 * Build the router for the /todos endpoints.
 * @param {{ service?: TodoService, logger?: Console }} [options]
 * @returns {import('express').Router}
 */
function createTodoRouter({ service = new TodoService(), logger = console } = {}) {
  const router = express.Router();

  router.post('/todos', (req, res, next) => {
    try {
      const body = req.body === undefined ? {} : req.body;

      if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'Request body must be a JSON object' });
      }

      const title = validateTitle(body.title);
      const todo = service.create(title);

      logger.info(`Created todo ${todo.id}: "${todo.title}"`);
      return res.status(201).json(todo);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/todos', (req, res, next) => {
    try {
      const todos = service.getAll();
      logger.info(`Retrieved ${todos.length} todo(s)`);
      return res.status(200).json(todos);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createTodoRouter };
