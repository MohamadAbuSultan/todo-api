'use strict';

/**
 * Fields an update may write. Mirrors the column whitelist a SQL-backed
 * repository has to apply.
 * @type {string[]}
 */
const MUTABLE_FIELDS = ['title'];

/**
 * In-memory implementation of the todo repository contract.
 *
 * It is the placeholder used until the PostgreSQL repository replaces it, and
 * it backs the unit and HTTP test suites so they stay independent of a
 * database. It keeps records in memory for the lifetime of the process.
 */
class InMemoryTodoRepository {
  constructor() {
    /** @type {Array<{ id: string, title: string }>} */
    this.records = [];
  }

  /**
   * Store a new item and return a copy of the stored record.
   * @param {{ id: string, title: string }} todo
   * @returns {Promise<{ id: string, title: string }>}
   */
  async create(todo) {
    const record = { id: todo.id, title: todo.title };

    this.records.push(record);

    return { ...record };
  }

  /**
   * Return every stored item in creation order.
   * @returns {Promise<Array<{ id: string, title: string }>>}
   */
  async findAll() {
    return this.records.map((record) => ({ ...record }));
  }

  /**
   * Apply the given changes to one item.
   * @param {string} id
   * @param {object} changes
   * @returns {Promise<{ id: string, title: string } | null>}
   */
  async update(id, changes) {
    const index = this.records.findIndex((record) => record.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...this.records[index] };

    for (const field of MUTABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        updated[field] = changes[field];
      }
    }

    this.records[index] = updated;

    return { ...updated };
  }

  /**
   * Delete one item and return a copy of the removed record.
   * @param {string} id
   * @returns {Promise<{ id: string, title: string } | null>}
   */
  async remove(id) {
    const index = this.records.findIndex((record) => record.id === id);

    if (index === -1) {
      return null;
    }

    const [removed] = this.records.splice(index, 1);

    return { ...removed };
  }
}

module.exports = { InMemoryTodoRepository, MUTABLE_FIELDS };
