import { SafeSoundManager, SoundUtils } from "./audioUtils";

// Get the safe sound manager instance
const safeSoundManager = SafeSoundManager.getInstance();

// Sound file mappings based on existing files in assets/sounds/sounds/
const sounds = {};
try {
  sounds.default = require("../assets/sounds/sounds/Default.wav");
} catch (error) {
  console.warn("Could not load Default.wav:", error);
}

try {
  sounds.whistle = require("../assets/sounds/sounds/whistle.mp3");
} catch (error) {
  console.warn("Could not load whistle.mp3:", error);
}

try {
  sounds.drum = require("../assets/sounds/sounds/Drum.mp3");
} catch (error) {
  console.warn("Could not load Drum.mp3:", error);
}

try {
  sounds.broadcast = require("../assets/sounds/sounds/Broadcast.mp3");
} catch (error) {
  console.warn("Could not load Broadcast.mp3:", error);
}

try {
  sounds.redcard = require("../assets/sounds/sounds/red card sound.mp3");
} catch (error) {
  console.warn("Could not load red card sound.mp3:", error);
}

try {
  sounds.notification = require("../assets/sounds/sounds/notification.mp3");
} catch (error) {
  console.warn("Could not load notification.mp3:", error);
}

// Sound mapping for settings values to actual sound keys
const soundMapping = {
  Default: "default",
  Whistle: "whistle",
  Drum: "drum",
  Broadcast: "broadcast",
  Horn: "notification", // Using notification.mp3 as horn sound
  Victory: "drum", // Using drum.mp3 as victory sound
  Notification: "notification",
  "Red Card": "redcard",
};

// Audio configuration is now handled by SafeAudio utility
// No need for manual configuration or caching

/**
 * Play a sound based on the sound type or setting name
 * @param {string} type - Sound type (default, whistle, drum, etc.) or setting name (Default, Whistle, etc.)
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @param {boolean} interrupt - Whether to interrupt currently playing sounds
 */
export async function playSound(
  type = "default",
  volume = 1.0,
  interrupt = false,
) {
  try {
    if (!SoundUtils.isAvailable()) {
      console.warn("⚠️ Audio not available, cannot play sound:", type);
      return;
    }

    const success = await safeSoundManager.playSound(type, volume, interrupt);
    if (success) {
      console.log(`✅ Sound played successfully: ${type}`);
    } else {
      console.warn(`⚠️ Failed to play sound: ${type}`);
    }
  } catch (error) {
    console.error(`❌ Error playing sound ${type}:`, error);
  }
}

/**
 * Play goal sound based on team and settings
 * @param {string} team - 'home' or 'away'
 * @param {object} settings - Match settings from context
 */
export async function playGoalSound(team, settings) {
  try {
    const success = await SoundUtils.playGoal(team, settings);
    if (success) {
      console.log(`✅ Goal sound played successfully for ${team}`);
    } else {
      console.log(`⚠️ Could not play goal sound for ${team}`);
    }
  } catch (error) {
    console.error(`❌ Error playing goal sound for ${team}:`, error);
  }
}

/**
 * Play red card sound with vibration support
 * @param {object} settings - Match settings from context
 */
export async function playRedCardSound(settings) {
  try {
    const success = await SoundUtils.playRedCard(settings);
    if (success) {
      console.log("✅ Red card sound played successfully");
    } else {
      console.log("⚠️ Could not play red card sound");
    }
  } catch (error) {
    console.error("❌ Error playing red card sound:", error);
  }
}

/**
 * Play notification sound
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export async function playNotificationSound(volume = 0.7) {
  try {
    const success = await SoundUtils.playNotification(volume);
    if (success) {
      console.log("✅ Notification sound played successfully");
    } else {
      console.log("⚠️ Could not play notification sound");
    }
  } catch (error) {
    console.error("❌ Error playing notification sound:", error);
  }
}

/**
 * Test sound playback (useful for settings screen)
 * @param {string} soundName - Name of sound to test
 */
export async function testSound(soundName) {
  try {
    const success = await SoundUtils.testSound(soundName);
    if (success) {
      console.log(`✅ Sound test successful: ${soundName}`);
    } else {
      console.log(`⚠️ Sound test failed: ${soundName}`);
    }
  } catch (error) {
    console.error(`❌ Error testing sound ${soundName}:`, error);
  }
}

/**
 * Stop all currently playing sounds
 */
export async function stopAllSounds() {
  try {
    await SoundUtils.getInstance().stopAllSounds();
    console.log("✅ All sounds stopped successfully");
  } catch (error) {
    console.error("❌ Error stopping all sounds:", error);
  }
}

/**
 * Clean up sound cache (call on app cleanup)
 */
export async function cleanupSounds() {
  try {
    await SoundUtils.getInstance().cleanup();
    console.log("✅ Sound cleanup completed");
  } catch (error) {
    console.error("❌ Error cleaning up sounds:", error);
  }
}

/**
 * Get available sound options for settings
 */
export function getAvailableSounds() {
  return SoundUtils.getAvailableSounds();
}

/**
 * Preload sounds for better performance
 */
export async function preloadSounds() {
  try {
    await SoundUtils.preloadSounds();
    console.log("✅ Sound preloading completed");
  } catch (error) {
    console.error("❌ Error preloading sounds:", error);
  }
}

export default {
  playSound,
  playGoalSound,
  playRedCardSound,
  playNotificationSound,
  testSound,
  stopAllSounds,
  cleanupSounds,
  getAvailableSounds,
  preloadSounds,
};
