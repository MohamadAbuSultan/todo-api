'use strict';

const { validateTitle } = require('../utils/validation');

/**
 * To-do item data model.
 */
class TodoItem {
  /**
   * @param {string} id unique identifier
   * @param {string} title user supplied title
   */
  constructor(id, title) {
    this.id = id;
    this.title = validateTitle(title);
    Object.freeze(this);
  }

  /**
   * @returns {{ id: string, title: string }}
   */
  toJSON() {
    return { id: this.id, title: this.title };
  }
}

/**
 * Create a validated to-do item.
 * @param {string} id
 * @param {string} title
 * @returns {TodoItem}
 */
function createTodoItem(id, title) {
  return new TodoItem(id, title);
}

module.exports = { TodoItem, createTodoItem };
