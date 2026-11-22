/**
 * To-Do List — single ES module.
 *
 * Responsibilities:
 * - Storage: read/write the `todo_app_tasks` Local Storage key and validate payloads.
 * - State: hold the in-memory task array and persistence availability.
 * - Domain: create, toggle, and delete tasks without touching the DOM.
 * - Render: rebuild the task list from state using safe text insertion only.
 * - Events/Init: wire delegated listeners, restore persisted tasks, and render.
 *
 * No libraries, no build step, and no network access. All user text reaches the
 * DOM through `textContent`/`value`; no HTML string is ever constructed from it.
 */

/* ==========================================================================
 * Constants
 * ========================================================================== */

/**
 * The single Local Storage key this application owns. No other key is ever
 * read or written, including transient probe keys.
 */
const STORAGE_KEY = 'todo_app_tasks';

/**
 * Current persisted schema version. The payload is intentionally a bare array
 * (no version envelope) because the product mandates the `{id,text,completed}`
 * object shape. Future incompatible shapes must add a migration branch in
 * `migrateStoredTask` before validation.
 */
const SCHEMA_VERSION = 1;

const STORAGE_UNAVAILABLE_MESSAGE =
  "Changes can't be saved in this browser, but you can keep using the list.";
const CORRUPT_DATA_MESSAGE =
  "Saved tasks couldn't be loaded, so the list started empty.";

const SELECTORS = {
  form: '#task-form',
  input: '#task-input',
  addButton: '#add-button',
  list: '#task-list',
  emptyState: '#empty-state',
  storageWarning: '#storage-warning',
};

/* ==========================================================================
 * State
 * ========================================================================== */

/**
 * Application state. `tasks` is ordered oldest-first and is only mutated by
 * the Domain functions below.
 */
const state = {
  /** @type {Array<{id: string, text: string, completed: boolean}>} */
  tasks: [],
  /** @type {boolean} True while storage reads/writes are believed to work. */
  persistenceAvailable: true,
  /** @type {Record<string, HTMLElement|null>} Cached DOM references. */
  dom: {},
};

/* ==========================================================================
 * Storage
 * ========================================================================== */

/**
 * Migration seam for persisted tasks.
 *
 * Only schema version 1 has ever been stored, so valid data is returned
 * unchanged. When the shape changes, branch on `SCHEMA_VERSION` here and
 * convert old payloads before validation; return `null` for anything that
 * cannot be migrated so it is dropped safely.
 *
 * @param {unknown} value Raw element from the stored array.
 * @returns {unknown|null} Migrated element, or null when unsupported.
 */
function migrateStoredTask(value) {
  switch (SCHEMA_VERSION) {
    case 1:
      return value;
    default:
      return null;
  }
}

/**
 * Check one value against the Task validation rules (V3–V7).
 *
 * @param {unknown} value Candidate stored element.
 * @returns {boolean} True when the value is a usable Task.
 */
function isValidTask(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const task = /** @type {Record<string, unknown>} */ (value);

  return (
    typeof task.id === 'string' &&
    task.id.length > 0 &&
    typeof task.text === 'string' &&
    task.text.trim().length > 0 &&
    typeof task.completed === 'boolean'
  );
}

/**
 * Parse and validate a raw storage string.
 *
 * Invalid JSON and non-array payloads are reported as `unreadable` and
 * resolve to an empty list. Invalid elements are dropped; later duplicate ids
 * are dropped in favor of the first occurrence. Fully invalid arrays are also
 * reported as `unreadable`. This function never throws.
 *
 * @param {string|null} raw Value read from Local Storage, or null when absent.
 * @returns {{tasks: Array<{id: string, text: string, completed: boolean}>, unreadable: boolean}}
 */
function parseTasks(raw) {
  if (raw === null) {
    return { tasks: [], unreadable: false };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { tasks: [], unreadable: true };
  }

  if (!Array.isArray(parsed)) {
    return { tasks: [], unreadable: true };
  }

  const tasks = [];
  const seenIds = new Set();
  let dropped = false;

  for (const element of parsed) {
    const candidate = migrateStoredTask(element);

    if (!isValidTask(candidate) || seenIds.has(candidate.id)) {
      dropped = true;
      continue;
    }

    seenIds.add(candidate.id);
    tasks.push({
      id: candidate.id,
      text: candidate.text.trim(),
      completed: candidate.completed,
    });
  }

  return { tasks, unreadable: dropped && tasks.length === 0 };
}

/**
 * Read the persisted task list.
 *
 * @returns {{tasks: Array<{id: string, text: string, completed: boolean}>, unreadable: boolean, readFailed: boolean}}
 *   Validated tasks; `unreadable` signals corrupt/unusable data; `readFailed`
 *   signals that storage itself could not be read (blocked or unavailable).
 */
function loadTasks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const { tasks, unreadable } = parseTasks(raw);
    return { tasks, unreadable, readFailed: false };
  } catch {
    return { tasks: [], unreadable: false, readFailed: true };
  }
}

/**
 * Persist the full task array to Local Storage.
 *
 * Only `id`, `text`, and `completed` are written. Serialization or quota
 * errors are swallowed and reported through the return value; this function
 * never throws and never rolls back in-memory state.
 *
 * @param {Array<{id: string, text: string, completed: boolean}>} tasks Tasks to save.
 * @returns {boolean} True on success, false on any storage error.
 */
function saveTasks(tasks) {
  try {
    const payload = tasks.map(({ id, text, completed }) => ({
      id,
      text,
      completed,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/* ==========================================================================
 * Storage status
 * ========================================================================== */

/**
 * Reveal the storage status notice without moving focus.
 *
 * @param {string} message Message to announce and display.
 * @returns {void}
 */
function showStorageWarning(message) {
  if (!state.dom.storageWarning) {
    return;
  }
  state.dom.storageWarning.textContent = message;
  state.dom.storageWarning.hidden = false;
}

/**
 * Hide the storage status notice.
 *
 * @returns {void}
 */
function hideStorageWarning() {
  if (!state.dom.storageWarning) {
    return;
  }
  state.dom.storageWarning.hidden = true;
  state.dom.storageWarning.textContent = '';
}

/**
 * Save the current tasks and reconcile the storage status notice.
 *
 * A failed write keeps the in-memory change (the session stays usable) and
 * shows the unavailable warning. A successful write clears any warning,
 * because a successful write proves storage is working again.
 *
 * @returns {boolean} True when the current state was persisted.
 */
function persist() {
  const saved = saveTasks(state.tasks);

  if (!saved) {
    state.persistenceAvailable = false;
    showStorageWarning(STORAGE_UNAVAILABLE_MESSAGE);
  } else if (!state.persistenceAvailable || !state.dom.storageWarning?.hidden) {
    state.persistenceAvailable = true;
    hideStorageWarning();
  }

  return saved;
}

/* ==========================================================================
 * Domain
 * ========================================================================== */

/**
 * Normalize a submitted title.
 *
 * @param {unknown} raw Raw input value.
 * @returns {string|null} Trimmed title, or null when nothing remains.
 */
function normalizeTitle(raw) {
  if (typeof raw !== 'string') {
    return null;
  }
  const text = raw.trim();
  return text.length > 0 ? text : null;
}

/**
 * Generate a stable, unique-enough task id.
 *
 * `crypto.randomUUID` needs a secure context, so a timestamp-plus-random
 * fallback covers non-secure contexts without adding a dependency.
 *
 * @returns {string} New task id.
 */
function generateId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create a new active task.
 *
 * @param {string} text Already-normalized, non-empty title.
 * @returns {{id: string, text: string, completed: boolean}} New task.
 */
function createTask(text) {
  return { id: generateId(), text, completed: false };
}

/**
 * Flip completion on exactly one task.
 *
 * @param {string} id Task identity.
 * @returns {{id: string, text: string, completed: boolean}|null} Updated task,
 *   or null when no task matches.
 */
function toggleTask(id) {
  const task = state.tasks.find((candidate) => candidate.id === id);
  if (!task) {
    return null;
  }
  task.completed = !task.completed;
  return task;
}

/**
 * Remove exactly one task, preserving the order of the rest.
 *
 * @param {string} id Task identity.
 * @returns {boolean} True when a task was removed.
 */
function deleteTask(id) {
  const index = state.tasks.findIndex((candidate) => candidate.id === id);
  if (index === -1) {
    return false;
  }
  state.tasks.splice(index, 1);
  return true;
}

/* ==========================================================================
 * Render
 * ========================================================================== */

/**
 * Build one task row per the UI contract.
 *
 * User text is inserted with `textContent` and `aria-label` only, so titles
 * containing markup characters are always displayed literally.
 *
 * @param {{id: string, text: string, completed: boolean}} task Task to render.
 * @returns {HTMLLIElement} New list item.
 */
function renderTask(task) {
  const item = document.createElement('li');
  item.className = 'task';
  if (task.completed) {
    item.classList.add('task--completed');
  }
  item.dataset.taskId = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.text);

  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text;

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'task-delete';
  deleteButton.textContent = 'Delete';
  deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);

  item.append(checkbox, text, deleteButton);
  return item;
}

/**
 * Show the friendly empty state exactly when no tasks exist.
 *
 * @returns {void}
 */
function updateEmptyState() {
  if (!state.dom.emptyState) {
    return;
  }
  state.dom.emptyState.hidden = state.tasks.length !== 0;
}

/**
 * Rebuild the list from state, in array order.
 *
 * @param {Array<{id: string, text: string, completed: boolean}>} tasks Tasks to display.
 * @returns {void}
 */
function render(tasks) {
  const list = state.dom.list;
  if (!list) {
    return;
  }

  list.replaceChildren();
  for (const task of tasks) {
    list.appendChild(renderTask(task));
  }
  updateEmptyState();
}

/* ==========================================================================
 * Events
 * ========================================================================== */

/**
 * Handle form submission from the Add button or Enter.
 *
 * Blank or whitespace-only input creates nothing, performs no write, and
 * keeps focus in the input. Successful adds append, persist, render, and
 * clear the input for the next entry.
 *
 * @param {SubmitEvent} event Form submit event.
 * @returns {void}
 */
function handleSubmit(event) {
  event.preventDefault();

  const text = normalizeTitle(state.dom.input?.value);
  if (text === null) {
    state.dom.input?.focus();
    return;
  }

  state.tasks.push(createTask(text));
  persist();
  render(state.tasks);
  state.dom.input.value = '';
  state.dom.input.focus();
}

/**
 * Restore keyboard focus to a row's checkbox after the list is re-rendered.
 *
 * A full re-render replaces every row element, so the browser drops focus to
 * the document body. This looks the row up by task id and re-focuses its
 * checkbox, keeping keyboard users on the control they just operated.
 *
 * @param {string} id Task identity whose checkbox should receive focus.
 * @returns {void}
 */
function focusTaskCheckbox(id) {
  if (!id) {
    return;
  }

  // The id may come from restored storage, so it is escaped before being used
  // in a selector; an unescaped id could otherwise throw a SyntaxError.
  const row = state.dom.list?.querySelector(
    `li.task[data-task-id="${CSS.escape(id)}"]`
  );
  const checkbox = row?.querySelector('.task-checkbox');

  if (checkbox instanceof HTMLInputElement) {
    checkbox.focus();
  }
}

/**
 * Handle completion toggles delegated from the task list.
 *
 * The list is rebuilt after the toggle, so the checkbox that fired the event
 * is replaced. Focus is restored to the same row's checkbox to keep keyboard
 * users in place.
 *
 * @param {Event} event Change event from a row checkbox.
 * @returns {void}
 */
function handleToggle(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const checkbox = event.target.closest('.task-checkbox');
  const item = checkbox?.closest('li.task');
  if (!checkbox || !item) {
    return;
  }

  const id = item.dataset.taskId;
  if (!id || !toggleTask(id)) {
    return;
  }

  persist();
  render(state.tasks);
  focusTaskCheckbox(id);
}

/**
 * Handle deletes delegated from the task list.
 *
 * After rendering, focus moves to the row that now occupies the deleted row's
 * index: the following task when one exists, otherwise the new last task.
 * When the list becomes empty, focus moves to the task input. This keeps
 * keyboard users in place after a deletion.
 *
 * @param {Event} event Click event from a row delete control.
 * @returns {void}
 */
function handleDelete(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest('button.task-delete');
  const item = button?.closest('li.task');
  if (!button || !item) {
    return;
  }

  const id = item.dataset.taskId;
  const siblings = Array.from(item.parentElement?.children ?? []);
  const removedIndex = siblings.indexOf(item);

  if (!id || !deleteTask(id)) {
    return;
  }

  persist();
  render(state.tasks);

  const rows = state.dom.list?.querySelectorAll('li.task') ?? [];
  if (rows.length === 0) {
    state.dom.input?.focus();
    return;
  }

  const nextRow = rows[Math.min(Math.max(removedIndex, 0), rows.length - 1)];
  const nextDelete = nextRow?.querySelector('.task-delete');
  if (nextDelete instanceof HTMLElement) {
    nextDelete.focus();
  } else {
    state.dom.input?.focus();
  }
}

/* ==========================================================================
 * Events / Init
 * ========================================================================== */

/**
 * Cache the DOM hooks declared by the UI contract.
 *
 * @returns {void}
 */
function cacheDom() {
  state.dom = {
    form: document.querySelector(SELECTORS.form),
    input: document.querySelector(SELECTORS.input),
    addButton: document.querySelector(SELECTORS.addButton),
    list: document.querySelector(SELECTORS.list),
    emptyState: document.querySelector(SELECTORS.emptyState),
    storageWarning: document.querySelector(SELECTORS.storageWarning),
  };
}

/**
 * Restore tasks from storage and surface any recovery warnings.
 *
 * An absent key is silent; corrupt data opens an empty list with a warning;
 * unreadable storage keeps the session usable and shows the unavailable
 * warning.
 *
 * @returns {void}
 */
function restoreFromStorage() {
  const { tasks, unreadable, readFailed } = loadTasks();
  state.tasks = tasks;

  if (readFailed) {
    state.persistenceAvailable = false;
    showStorageWarning(STORAGE_UNAVAILABLE_MESSAGE);
  } else if (unreadable) {
    showStorageWarning(CORRUPT_DATA_MESSAGE);
  }
}

/**
 * Bind form and delegated list listeners exactly once.
 *
 * @returns {void}
 */
function bindEvents() {
  state.dom.form?.addEventListener('submit', handleSubmit);
  state.dom.list?.addEventListener('change', handleToggle);
  state.dom.list?.addEventListener('click', handleDelete);
}

/**
 * Application entry point.
 *
 * The body is guarded so an unexpected startup failure cannot throw out of the
 * module; if the warning element is available, the failure is surfaced to the
 * user instead.
 *
 * @returns {void}
 */
function init() {
  try {
    cacheDom();
    restoreFromStorage();
    render(state.tasks);
    bindEvents();
  } catch {
    showStorageWarning(STORAGE_UNAVAILABLE_MESSAGE);
  }
}

init();
