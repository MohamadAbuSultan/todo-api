'use strict';

const { LocalStorageStore } = require('../storage/local-storage');

/**
 * Fields an update may write. Mirrors the column whitelist a SQL-backed
 * repository has to apply.
 * @type {string[]}
 */
const MUTABLE_FIELDS = ['title'];

/**
 * Repository implementation backed by Node.js Web Storage.
 *
 * It keeps the collection in memory for the lifetime of the process and
 * writes it through to the storage adapter after every change, so the items
 * are restored on the next start when the runtime provides and is configured
 * for Web Storage. When storage is unavailable the repository still works and
 * only keeps the items in memory.
 *
 * Storage failures are never fatal: a failed write leaves the in-memory
 * change in place and the request that caused it succeeds.
 */
class LocalStorageTodoRepository {
  /**
   * @param {{
   *   store?: { load: () => unknown[], save: (value: unknown[]) => boolean },
   *   logger?: Console
   * }} [options]
   */
  constructor({ store = new LocalStorageStore(), logger = console } = {}) {
    this.store = store;
    this.logger = logger;
    /** @type {Array<{ id: string, title: string }>} */
    this.records = this.load();
  }

  /**
   * Load the stored items and keep the valid ones.
   * Invalid stored entries are skipped rather than preventing startup.
   * @returns {Array<{ id: string, title: string }>}
   */
  load() {
    const storedItems = this.store.load();
    const records = [];

    for (const storedItem of storedItems) {
      try {
        if (!storedItem || typeof storedItem !== 'object') {
          throw new Error('Stored item must be an object');
        }

        if (typeof storedItem.id !== 'string' || storedItem.id === '') {
          throw new Error('Stored item id must be a non-empty string');
        }

        if (typeof storedItem.title !== 'string' || storedItem.title.trim() === '') {
          throw new Error('Stored item title must be a non-empty string');
        }

        records.push({ id: storedItem.id, title: storedItem.title.trim() });
      } catch (error) {
        this.warn(`Skipping invalid stored todo: ${error.message}`);
      }
    }

    return records;
  }

  /**
   * Write the current collection through to storage.
   * A failed write is reported by the store and leaves the in-memory change
   * in place; it never rejects.
   * @returns {boolean} true when the collection was written successfully
   */
  persist() {
    return this.store.save(this.records.map((record) => ({ ...record })));
  }

  /**
   * Store a new item and return a copy of the stored record.
   * @param {{ id: string, title: string }} todo
   * @returns {Promise<{ id: string, title: string }>}
   */
  async create(todo) {
    const record = { id: todo.id, title: todo.title };

    this.records.push(record);
    this.persist();

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
    this.persist();

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
    this.persist();

    return { ...removed };
  }

  /**
   * @param {string} message
   * @returns {void}
   */
  warn(message) {
    if (this.logger && typeof this.logger.warn === 'function') {
      this.logger.warn(message);
    }
  }
}

module.exports = { LocalStorageTodoRepository, MUTABLE_FIELDS };
