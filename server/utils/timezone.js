// Utility functions untuk handle timezone WIB (UTC+7)

/**
 * Convert date to WIB timezone
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in WIB timezone
 */
export const toWIB = (date = new Date()) => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Get UTC time in milliseconds
  const utcTime = inputDate.getTime();
  
  // WIB is UTC+7 (7 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  const wibOffset = 7 * 60 * 60 * 1000;
  
  // Add WIB offset
  return new Date(utcTime + wibOffset);
};

/**
 * Get current date/time (server already set to WIB timezone)
 * @returns {Date} Current date
 */
export const nowWIB = () => {
  return new Date();
};

/**
 * Format date to WIB ISO string
 * @param {Date|string} date - Date to format
 * @returns {string} ISO string in WIB
 */
export const toWIBString = (date = new Date()) => {
  const wibDate = toWIB(date);
  return wibDate.toISOString();
};

/**
 * Parse tanggal string and convert to Date for database storage
 * Database stores in UTC, so we need to convert WIB time to UTC
 * Handles: "YYYY-MM-DD" or ISO string
 * @param {string} tanggalString - Date string to parse
 * @returns {Date} Date object for database (will be stored as UTC)
 */
export const parseTanggalWIB = (tanggalString) => {
  if (!tanggalString) {
    return new Date(); // Current time in UTC
  }

  // If it's already a full ISO string with time
  if (tanggalString.includes('T')) {
    return new Date(tanggalString);
  }

  // If it's just a date string (YYYY-MM-DD)
  // Create date at current time in WIB timezone
  const [year, month, day] = tanggalString.split('-').map(Number);
  const now = new Date();
  
  // Create date in local timezone (which should be WIB on server)
  const date = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  
  return date;
};

/**
 * Get start of day in WIB
 * @param {Date|string} date - Date to get start of day
 * @returns {Date} Start of day in WIB (00:00:00)
 */
export const startOfDayWIB = (date = new Date()) => {
  const wibDate = toWIB(date);
  wibDate.setHours(0, 0, 0, 0);
  return wibDate;
};

/**
 * Get end of day in WIB
 * @param {Date|string} date - Date to get end of day
 * @returns {Date} End of day in WIB (23:59:59)
 */
export const endOfDayWIB = (date = new Date()) => {
  const wibDate = toWIB(date);
  wibDate.setHours(23, 59, 59, 999);
  return wibDate;
};
