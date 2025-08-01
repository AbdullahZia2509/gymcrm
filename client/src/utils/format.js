/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the formatted string
 * @param {Object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false, options = {}) => {
  if (!date) return "N/A";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime && {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", mergedOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = "PKR") => {
  if (value === undefined || value === null) return "N/A";

  try {
    // Format with PKR currency
    const formatted = new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
    }).format(value);
    
    // Replace the PKR symbol with Rs.
    return formatted.replace(/PKR|₨|Rs/i, "Rs.");
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `Rs. ${value}`;
  }
};

/**
 * Format phone number to (XXX) XXX-XXXX
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return "";

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX if 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  // Otherwise return as is
  return phone;
};

/**
 * Capitalize first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return "";

  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
