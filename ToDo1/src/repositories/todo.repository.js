'use strict';

/**
 * Persistence contract for to-do items.
 *
 * A repository owns every read and write of the stored collection. It knows
 * nothing about request validation, HTTP status codes, or business rules:
 * those belong to the service layer.
 *
 * Responsibilities of an implementation:
 * - Perform all data access and translate it into plain records.
 * - Never expose mutable internal state; return copies of stored records.
 * - Return `null` when an identifier does not match a stored item, so the
 *   service can map that outcome to a not-found error.
 * - Apply only the fields an implementation supports; ignore or reject
 *   anything else so that a caller cannot write an unknown field.
 * - Report failures by rejecting with an error. The service lets those
 *   rejections propagate so that unexpected failures surface as server
 *   errors instead of being mistaken for client mistakes.
 */

/**
 * @typedef {object} TodoRecord
 * @property {string} id Opaque identifier of the item.
 * @property {string} title Validated, whitespace-trimmed title of the item.
 */

/**
 * @typedef {object} TodoRepository
 * @property {(todo: TodoRecord) => Promise<TodoRecord>} create
 *   Store a new item and return the stored record.
 * @property {() => Promise<TodoRecord[]>} findAll
 *   Return every stored item in creation order.
 * @property {(id: string, changes: { title?: string }) => Promise<TodoRecord | null>} update
 *   Apply the given changes to one item and return the updated record, or
 *   `null` when no item has that identifier.
 * @property {(id: string) => Promise<TodoRecord | null>} remove
 *   Delete one item and return the removed record, or `null` when no item has
 *   that identifier.
 */

/**
 * The methods every repository implementation must provide.
 * @type {string[]}
 */
const REQUIRED_METHODS = ['create', 'findAll', 'update', 'remove'];

/**
 * Determine whether a value satisfies the repository contract.
 * @param {unknown} repository
 * @returns {boolean}
 */
function isTodoRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    return false;
  }

  return REQUIRED_METHODS.every((method) => typeof repository[method] === 'function');
}

module.exports = { REQUIRED_METHODS, isTodoRepository };
