/**
 * ✅ UNIVERSAL TIME UTILITIES
 * 
 * Provides timezone-aware time formatting that works worldwide.
 * Automatically adapts to the user's device timezone:
 * - Uganda (EAT, UTC+3)
 * - China (CST, UTC+8)
 * - USA (EST/PST, UTC-5/-8)
 * - And all other countries
 * 
 * All functions ensure:
 * - Automatic local timezone conversion
 * - Consistent 24-hour format (HH:MM) - international standard
 * - Match times display correctly for ANY user location
 * - No NaN or invalid time displays
 */

/**
 * Format match time in 24-hour format for display
 * Converts UTC time to user's local timezone automatically
 * 
 * @param dateString - ISO date string from API (e.g., "2025-12-02T14:00:00Z")
 * @returns Formatted time string in user's local time
 * @example
 * API: "2025-12-02T14:00:00Z" (UTC)
 * Uganda: "17:00" (EAT, UTC+3)
 * China: "22:00" (CST, UTC+8)
 * USA (EST): "09:00" (UTC-5)
 */
export function formatMatchTime(dateString: string | undefined | null): string {
  // ✅ Safety check
  if (!dateString) {
    console.warn("⚠️ formatMatchTime: Invalid date string:", dateString);
    return "--:--";
  }

  try {
    const date = new Date(dateString);

    // ✅ Validate date
    if (isNaN(date.getTime())) {
      console.warn("⚠️ formatMatchTime: Invalid date object from:", dateString);
      return "--:--";
    }

    // ✅ Use device's local timezone (works worldwide automatically)
    const hours = date.getHours(); // Gets local hours in user's timezone
    const minutes = date.getMinutes(); // Gets local minutes

    // ✅ Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn("⚠️ formatMatchTime: NaN detected:", { hours, minutes, dateString });
      return "--:--";
    }

    // ✅ Format as HH:MM (24-hour format - international standard)
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch (error) {
    console.error("❌ formatMatchTime error:", error);
    return "--:--";
  }
}

/**
 * Format date for display
 * 
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Mon, Dec 2")
 */
export function formatMatchDate(dateString: string | undefined | null): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();

    return `${dayName}, ${monthName} ${dayNum}`;
  } catch {
    return "";
  }
}

/**
 * Get date for API requests (YYYY-MM-DD format)
 * Uses local timezone to determine "today"
 * 
 * @param date - Date object (defaults to now)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateForApi(date: Date = new Date()): string {
  try {
    // ✅ Use local date components (respects user's timezone)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Compare two dates to determine chronological order
 * 
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export function compareDateTimes(a: string, b: string): number {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return dateA.getTime() - dateB.getTime();
}

/**
 * Check if a date is today (in user's local timezone)
 */
export function isToday(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Check if a date is yesterday (in user's local timezone)
 */
export function isYesterday(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Check if a date is tomorrow (in user's local timezone)
 */
export function isTomorrow(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  } catch {
    return false;
  }
}
