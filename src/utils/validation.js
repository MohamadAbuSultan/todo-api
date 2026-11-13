'use strict';

/**
 * Create an error that maps to a client (4xx) response.
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error & { statusCode: number }}
 */
function validationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Validate and normalize a to-do title.
 * @param {unknown} title
 * @returns {string} trimmed title
 * @throws {Error & { statusCode: number }} when the title is missing, blank, or not text
 */
function validateTitle(title) {
  if (title === undefined || title === null) {
    throw validationError('Title is required');
  }

  if (typeof title !== 'string') {
    throw validationError('Title must be a string');
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle === '') {
    throw validationError('Title cannot be empty');
  }

  return trimmedTitle;
}

module.exports = { validateTitle, validationError };
