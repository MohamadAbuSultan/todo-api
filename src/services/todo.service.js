'use strict';

const { v4: uuidv4 } = require('uuid');
const { TodoItem } = require('../models/todo-item');

/**
 * Business logic and in-memory storage for to-do items.
 */
class TodoService {
  /**
   * @param {{ idGenerator?: () => string }} [options]
   */
  constructor({ idGenerator = uuidv4 } = {}) {
    this.idGenerator = idGenerator;
    /** @type {TodoItem[]} */
    this.todos = [];
  }

  /**
   * Create and store a new to-do item.
   * @param {unknown} title
   * @returns {{ id: string, title: string }}
   */
  create(title) {
    const todo = new TodoItem(this.idGenerator(), title);
    this.todos.push(todo);
    return todo.toJSON();
  }

  /**
   * Return all stored to-do items in creation order.
   * @returns {Array<{ id: string, title: string }>}
   */
  getAll() {
    return this.todos.map((todo) => todo.toJSON());
  }

  /**
   * Remove all stored items (useful for tests).
   * @returns {void}
   */
  clear() {
    this.todos.length = 0;
  }
}

module.exports = { TodoService };
