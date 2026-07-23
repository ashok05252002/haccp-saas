/**
 * Date utility functions for Chef2Comply
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format a date to "Sunday, July 12, 2026"
 */
export const formatFullDate = (date) => {
  const d = new Date(date);
  const dayName = DAYS[d.getDay()];
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${dayName}, ${month} ${day}, ${year}`;
};

/**
 * Get the day name from a date
 */
export const getDayName = (date) => {
  return DAYS[new Date(date).getDay()];
};

/**
 * Format date to "Month Day, Year"
 */
export const formatDateShort = (date) => {
  const d = new Date(date);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDateInput = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDateISO = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

/**
 * Add or subtract days from a date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get current time as HH:MM
 */
export const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};
