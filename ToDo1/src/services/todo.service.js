'use strict';

const { v4: uuidv4 } = require('uuid');
const { TodoItem } = require('../models/todo-item');
const { isTodoRepository } = require('../repositories/todo.repository');
const { validateTitle, validationError } = require('../utils/validation');

/**
 * Fields an update may change. Anything else is ignored by the service; the
 * repository applies the same whitelist again when it writes the change.
 * @type {string[]}
 */
const ALLOWED_UPDATE_FIELDS = ['title'];

/**
 * Keep only the fields an update is allowed to change.
 * @param {unknown} changes
 * @returns {object}
 */
function pickAllowedFields(changes) {
  const picked = {};

  if (!changes || typeof changes !== 'object') {
    return picked;
  }

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(changes, field)) {
      picked[field] = changes[field];
    }
  }

  return picked;
}

/**
 * Business logic for to-do items.
 *
 * The service owns validation and business rules and delegates every read and
 * write to an injected repository. It never keeps its own copy of the stored
 * collection.
 */
class TodoService {
  /**
   * @param {{
   *   idGenerator?: () => string,
   *   repository: import('../repositories/todo.repository').TodoRepository
   * }} options
   */
  constructor({ idGenerator = uuidv4, repository } = {}) {
    if (!isTodoRepository(repository)) {
      throw new Error(
        'TodoService requires a repository implementing create, findAll, update, and remove'
      );
    }

    this.idGenerator = idGenerator;
    this.repository = repository;
  }

  /**
   * Create and store a new to-do item.
   * @param {unknown} title
   * @returns {Promise<{ id: string, title: string }>}
   */
  async create(title) {
    const validatedTitle = validateTitle(title);
    const todo = new TodoItem(this.idGenerator(), validatedTitle);

    return this.repository.create(todo.toJSON());
  }

  /**
   * Return all stored to-do items in creation order.
   * @returns {Promise<Array<{ id: string, title: string }>>}
   */
  async getAll() {
    return this.repository.findAll();
  }

  /**
   * Update an existing item.
   * The title is validated before the item is looked up, so an invalid title
   * is reported as a client error even when the identifier is unknown.
   * @param {string} id
   * @param {unknown} changes the fields to change
   * @returns {Promise<{ id: string, title: string }>}
   */
  async update(id, changes) {
    const fields = pickAllowedFields(changes);
    const validatedTitle = validateTitle(fields.title);
    const updated = await this.repository.update(id, { title: validatedTitle });

    if (!updated) {
      throw validationError('Todo not found', 404);
    }

    return updated;
  }

  /**
   * Remove an existing item.
   * @param {string} id
   * @returns {Promise<{ id: string, title: string }>}
   */
  async remove(id) {
    const removed = await this.repository.remove(id);

    if (!removed) {
      throw validationError('Todo not found', 404);
    }

    return removed;
  }
}

module.exports = { TodoService, ALLOWED_UPDATE_FIELDS };
