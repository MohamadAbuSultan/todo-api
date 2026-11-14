'use strict';

const DEFAULT_STORAGE_KEY = 'todos';

/**
 * Resolve the browser localStorage object when it is available.
 * Accessing localStorage can throw (for example when storage is blocked),
 * so the lookup itself must be guarded.
 * @returns {Storage | null}
 */
function getDefaultStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch (error) {
    return null;
  }

  return null;
}

/**
 * Determine whether a value exposes the Storage-style methods we need.
 * @param {unknown} storage
 * @returns {boolean}
 */
function isStorageLike(storage) {
  return (
    Boolean(storage) &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function'
  );
}

/**
 * Detect the platform-specific names used for quota exhaustion errors.
 * @param {unknown} error
 * @returns {boolean}
 */
function isQuotaExceededError(error) {
  if (!error) {
    return false;
  }

  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

/**
 * Safely read and write JSON data through a Storage-compatible object.
 * Missing storage, malformed JSON, and write failures are handled without
 * throwing so the rest of the application can keep working.
 */
class LocalStorageStore {
  /**
   * @param {{
   *   key?: string,
   *   storage?: Storage | null,
   *   logger?: Console
   * }} [options]
   */
  constructor({ key = DEFAULT_STORAGE_KEY, storage, logger = console } = {}) {
    this.key = key;
    this.storage = storage === undefined ? getDefaultStorage() : storage;
    this.logger = logger;
  }

  /**
   * @returns {boolean}
   */
  isAvailable() {
    return isStorageLike(this.storage);
  }

  /**
   * Load previously saved data.
   * Returns an empty array when storage is unavailable, the key is empty,
   * the JSON is invalid, or the parsed value is not an array.
   * @returns {unknown[]}
   */
  load() {
    if (!this.isAvailable()) {
      return [];
    }

    let serialized;

    try {
      serialized = this.storage.getItem(this.key);
    } catch (error) {
      this.warn('Unable to read from localStorage', error);
      return [];
    }

    if (serialized === null || serialized === undefined || serialized === '') {
      return [];
    }

    let parsed;

    try {
      parsed = JSON.parse(serialized);
    } catch (error) {
      this.warn('Stored data is not valid JSON; starting with an empty list', error);
      return [];
    }

    if (!Array.isArray(parsed)) {
      this.warn('Stored data is not an array; starting with an empty list');
      return [];
    }

    return parsed;
  }

  /**
   * Serialize and save data.
   * @param {unknown} value
   * @returns {boolean} true when the value was written successfully
   */
  save(value) {
    if (!this.isAvailable()) {
      return false;
    }

    let serialized;

    try {
      serialized = JSON.stringify(value);
    } catch (error) {
      this.warn('Unable to serialize todo data', error);
      return false;
    }

    if (serialized === undefined) {
      this.warn('Unable to serialize todo data');
      return false;
    }

    try {
      this.storage.setItem(this.key, serialized);
      return true;
    } catch (error) {
      if (isQuotaExceededError(error)) {
        this.warn('localStorage quota exceeded; changes are kept in memory only', error);
      } else {
        this.warn('Unable to write to localStorage; changes are kept in memory only', error);
      }

      return false;
    }
  }

  /**
   * Remove the stored entry.
   * @returns {boolean}
   */
  clear() {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      if (typeof this.storage.removeItem === 'function') {
        this.storage.removeItem(this.key);
      } else {
        this.storage.setItem(this.key, '[]');
      }

      return true;
    } catch (error) {
      this.warn('Unable to clear localStorage', error);
      return false;
    }
  }

  /**
   * @param {string} message
   * @param {unknown} [error]
   * @returns {void}
   */
  warn(message, error) {
    if (this.logger && typeof this.logger.warn === 'function') {
      this.logger.warn(message, error);
    }
  }
}

module.exports = {
  DEFAULT_STORAGE_KEY,
  LocalStorageStore,
  getDefaultStorage,
  isQuotaExceededError,
  isStorageLike,
};
