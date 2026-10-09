import { store } from "./store";

export function debounce() { // fix for resize observer error
  // Define debounce function
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  };

  // Override global ResizeObserver
  const _ResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback) {
      super(debounce(callback, 20)); // 20ms delay
    }
  };
}

/**
 * Filters an array of items by a field value.
 * @param {Array} items - source array
 * @param {string} field - item field to compare
 * @param {*} value - filter value (falsy values return items unchanged)
 * @param {string} mode - "eq" for exact match, "includes" for substring match
 * @returns {Array} filtered array
 */
export function filterByField(items, field, value, mode = "eq") {
  if (!value) return items;
  const needle = value.toLowerCase();
  return items.filter((item) => {
    const haystack = String(item[field] ?? "").toLowerCase();
    return mode === "includes" ? haystack.includes(needle) : haystack === needle;
  });
}

/**
 * Sorts an array of items by a field value.
 * @param {Array} items - source array
 * @param {string} column - item field to sort by
 * @param {boolean} desc - true for descending order
 * @returns {Array} sorted array
 */
export function sortByField(items, column, desc = false) {
  return items.sort((a, b) => {
    if (a[column] === b[column]) return 0;
    return desc
      ? a[column] < b[column]
        ? 1
        : -1
      : a[column] > b[column]
        ? 1
        : -1;
  });
}

/**
 * Filters an array of objects by a search term.
 * @param {Array} list - source array
 * @param {string} term - search term
 * @returns {Array} filtered array
 */
export function searchByText(list, term) {
  const t = term.trim().toLowerCase();
  if (!t) return list;
  return list.filter((item) => JSON.stringify(item).toLowerCase().includes(t));
}

/**
 * Formats a timestamp into a human-readable string.
 * @param {string} timestamp - timestamp string
 * @returns {string} formatted string
 */
export function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMins = Math.floor((now - then) / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return then.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Formats a timestamp into a human-readable string
 * @param {string} timestamp - timestamp string (ISO foramt)
 * @returns {string} formatted string
 */
export function formatTimeFromNow(timestamp) {
  const then = new Date(timestamp);
  const now = new Date();

  const diffMs = then - now;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMs < 0) {
    return "Past";
  }

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) {
    return `In ${diffMins} min${diffMins !== 1 ? "s" : ""}`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `In ${diffHours} hr${diffHours !== 1 ? "s" : ""}`;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const diffDays = Math.round((date - today) / 86400000);

  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 14) return "Next week";

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `In ${weeks} weeks`;
  }

  return then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

/**
 * Extracts date parts from a timestamp.
 * @param {string} value - timestamp string
 * @returns {Object} date parts
 */
function getDateTimeParts(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return { year, month, day, hours, minutes, seconds };
}

/**
 * Formats date string to `yyyy-mm-ddThh:mm`
 * @param {string} value - timestamp string
 * @returns {string} formatted ISO datetime
 */
export function formatDateTimeLocal(value) {
  if (!value) return "";
  const { year, month, day, hours, minutes, seconds } = getDateTimeParts(value);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Formats date string to `mm/dd/yyyy`, for display only
 * @param {string} value - timestamp string
 * @returns {string} formatted local date
 */
export function formatDate(value) { // formats to mm/dd/yyyy
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

/**
 * Prevents focus from moving into a modal when the close button is clicked.
 * Fix for aria console warnings.
 * @param {Object} modalRef - modal DOM element
 */
export function clearModalFocus(modalRef) {
  modalRef.addEventListener("hide.bs.modal", () => {
    // move focus out of the modal BEFORE Bootstrap sets aria-hidden="true" on it.
    // otherwise, if the clicked close button still holds focus (a descendant of the
    // modal), the browser blocks aria-hidden and logs:
    // "Blocked aria-hidden on an element because its descendant retained focus."
    if (document.activeElement && modalRef.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });
}

/**
 * Checks if user is in a group
 * @param {string} groupName - group name
 * @returns {boolean} true if user is in group
 */
export function inGroup(groupName) {
  return Object.values(store.authenticated.groups).includes(groupName);
}

/**
 * Checks if current user is owner of the resource; resource author is identified by employee number
 * @param {string} employeeNum - employee number
 * @returns {boolean} true if user is owner
 */
export function isOwner(refEmpNum) {
  return parseInt(refEmpNum) === parseInt(store.authenticated.user.number);
}