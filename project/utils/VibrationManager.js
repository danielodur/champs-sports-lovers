import { Vibration, Platform } from 'react-native';

// Vibration patterns for different events
const VIBRATION_PATTERNS = {
  goal: [0, 200], // Quick single vibration for goals
  redCard: [0, 500, 200, 500], // Double vibration pattern for red cards
  yellowCard: [0, 100], // Very brief vibration for yellow cards
  halfTime: [0, 300, 100, 300, 100, 300], // Triple pattern for half-time
  fullTime: [0, 1000], // Long vibration for full-time
  matchStart: [0, 100, 50, 100], // Quick double for match start
  penalty: [0, 200, 100, 200, 100, 200], // Triple pattern for penalties
  notification: [0, 150], // Standard notification vibration
};

/**
 * Check if vibration is supported on the current platform
 * @returns {boolean} True if vibration is supported
 */
export function isVibrationSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Vibrate with a specific pattern for match events
 * @param {string} eventType - Type of event (goal, redCard, etc.)
 * @param {object} settings - Match settings from context
 */
export function vibrateForEvent(eventType, settings) {
  if (!isVibrationSupported() || !settings.vibrationEnabled) {
    console.log(`🔇 Vibration disabled or not supported for ${eventType}`);
    return;
  }

  const pattern = VIBRATION_PATTERNS[eventType];
  if (!pattern) {
    console.warn(`⚠️ No vibration pattern found for event: ${eventType}`);
    return;
  }

  try {
    console.log(`📳 Vibrating for ${eventType} event`);
    Vibration.vibrate(pattern);
  } catch (error) {
    console.error(`❌ Error vibrating for ${eventType}:`, error);
  }
}

/**
 * Vibrate for goal events with team-specific intensity
 * @param {string} team - 'home', 'away', or 'general'
 * @param {object} settings - Match settings from context
 */
export function vibrateForGoal(team, settings) {
  if (!settings.vibrationEnabled || !settings.goalNotification) {
    console.log('🔇 Goal vibration disabled');
    return;
  }

  try {
    console.log(`⚽ Vibrating for ${team} team goal`);
    
    // Slightly different patterns for home vs away goals
    let pattern;
    if (team === 'home') {
      pattern = [0, 250]; // Slightly longer for home team
    } else if (team === 'away') {
      pattern = [0, 200]; // Standard pattern for away team
    } else {
      pattern = VIBRATION_PATTERNS.goal; // Default goal pattern
    }

    Vibration.vibrate(pattern);
  } catch (error) {
    console.error(`❌ Error vibrating for ${team} goal:`, error);
  }
}

/**
 * Vibrate for red card events
 * @param {object} settings - Match settings from context
 */
export function vibrateForRedCard(settings) {
  if (!settings.vibrationEnabled || !settings.redCardSound) {
    console.log('🔇 Red card vibration disabled');
    return;
  }

  try {
    console.log('🟥 Vibrating for red card');
    Vibration.vibrate(VIBRATION_PATTERNS.redCard);
  } catch (error) {
    console.error('❌ Error vibrating for red card:', error);
  }
}

/**
 * Vibrate for general notifications
 * @param {boolean} enabled - Whether vibration is enabled
 */
export function vibrateForNotification(enabled = true) {
  if (!isVibrationSupported() || !enabled) {
    return;
  }

  try {
    console.log('🔔 Vibrating for notification');
    Vibration.vibrate(VIBRATION_PATTERNS.notification);
  } catch (error) {
    console.error('❌ Error vibrating for notification:', error);
  }
}

/**
 * Vibrate with a custom pattern
 * @param {number[]} pattern - Custom vibration pattern array
 * @param {boolean} enabled - Whether vibration is enabled
 */
export function vibrateWithCustomPattern(pattern, enabled = true) {
  if (!isVibrationSupported() || !enabled) {
    return;
  }

  try {
    console.log(`📳 Custom vibration pattern: [${pattern.join(', ')}]`);
    Vibration.vibrate(pattern);
  } catch (error) {
    console.error('❌ Error with custom vibration pattern:', error);
  }
}

/**
 * Stop all vibrations
 */
export function stopVibration() {
  try {
    console.log('⏹️ Stopping all vibrations');
    Vibration.cancel();
  } catch (error) {
    console.error('❌ Error stopping vibration:', error);
  }
}

/**
 * Test vibration (useful for settings screen)
 * @param {string} eventType - Type of event to test
 */
export function testVibration(eventType = 'notification') {
  if (!isVibrationSupported()) {
    console.log('❌ Vibration not supported on this device');
    return;
  }

  const pattern = VIBRATION_PATTERNS[eventType] || VIBRATION_PATTERNS.notification;
  
  try {
    console.log(`🧪 Testing ${eventType} vibration`);
    Vibration.vibrate(pattern);
  } catch (error) {
    console.error(`❌ Error testing ${eventType} vibration:`, error);
  }
}

/**
 * Get available vibration patterns for settings
 */
export function getAvailableVibrationPatterns() {
  return Object.keys(VIBRATION_PATTERNS);
}

export default {
  vibrateForEvent,
  vibrateForGoal,
  vibrateForRedCard,
  vibrateForNotification,
  vibrateWithCustomPattern,
  stopVibration,
  testVibration,
  getAvailableVibrationPatterns,
  isVibrationSupported,
}; 