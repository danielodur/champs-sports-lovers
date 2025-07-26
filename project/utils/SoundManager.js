import { Audio } from 'expo-av';

// Sound file mappings based on existing files in assets/sounds/sounds/
const sounds = {
  default: require('../assets/sounds/sounds/Default.wav'),
  whistle: require('../assets/sounds/sounds/whistle.mp3'),
  drum: require('../assets/sounds/sounds/Drum.mp3'),
  broadcast: require('../assets/sounds/sounds/Broadcast.mp3'),
  redcard: require('../assets/sounds/sounds/red card sound.mp3'),
  notification: require('../assets/sounds/sounds/notification.mp3'),
};

// Sound mapping for settings values to actual sound keys
const soundMapping = {
  'Default': 'default',
  'Whistle': 'whistle', 
  'Drum': 'drum',
  'Broadcast': 'broadcast',
  'Horn': 'notification', // Using notification.mp3 as horn sound
  'Victory': 'drum', // Using drum.mp3 as victory sound
  'Notification': 'notification',
  'Red Card': 'redcard',
};

// Configure audio settings for better performance
let isAudioConfigured = false;

const configureAudio = async () => {
  if (isAudioConfigured) return;
  
  try {
    // ✅ ENHANCED: More robust audio configuration with proper constants
    const audioConfig = {
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    };

    // Add interruption modes if available
    if (Audio.InterruptionModeIOS) {
      audioConfig.interruptionModeIOS = Audio.InterruptionModeIOS.DoNotMix;
    }
    if (Audio.InterruptionModeAndroid) {
      audioConfig.interruptionModeAndroid = Audio.InterruptionModeAndroid.DoNotMix;
    }

    await Audio.setAudioModeAsync(audioConfig);
    isAudioConfigured = true;
    console.log('🔊 Audio configured successfully');
  } catch (error) {
    console.error('❌ Error configuring audio:', error);
    
    // ✅ FALLBACK: Try minimal configuration
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      isAudioConfigured = true;
      console.log('🔊 Audio configured with minimal settings');
    } catch (fallbackError) {
      console.warn('⚠️ Audio configuration failed, sounds may not work properly:', fallbackError);
      isAudioConfigured = true; // Set to true to prevent infinite retries
    }
  }
};

// Cache for loaded sounds to improve performance
const soundCache = new Map();

/**
 * Play a sound based on the sound type or setting name
 * @param {string} type - Sound type (default, whistle, drum, etc.) or setting name (Default, Whistle, etc.)
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @param {boolean} interrupt - Whether to interrupt currently playing sounds
 */
export async function playSound(type = 'default', volume = 1.0, interrupt = false) {
  try {
    // Configure audio on first use
    await configureAudio();

    // Map setting names to sound keys
    const soundKey = soundMapping[type] || type.toLowerCase();
    
    // Validate sound exists
    if (!sounds[soundKey]) {
      console.warn(`⚠️ Sound not found: ${type} (mapped to: ${soundKey})`);
      return;
    }

    console.log(`🔊 Playing sound: ${type} (${soundKey})`);

    // Check cache first for better performance
    let sound;
    const cacheKey = soundKey;
    
    if (soundCache.has(cacheKey)) {
      sound = soundCache.get(cacheKey);
      // Reset to beginning if sound was previously played
      await sound.setPositionAsync(0);
    } else {
      // Load new sound with error handling
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          sounds[soundKey],
          { 
            shouldPlay: false,
            volume: volume,
            isLooping: false,
          }
        );
        sound = newSound;
      } catch (loadError) {
        console.error(`❌ Error loading sound ${soundKey}:`, loadError);
        return;
      }
      
      // Cache the sound for reuse (limit cache size to prevent memory issues)
      if (soundCache.size < 10) {
        soundCache.set(cacheKey, sound);
      }
    }

    // Set volume safely
    try {
      await sound.setVolumeAsync(volume);
    } catch (volumeError) {
      console.warn(`⚠️ Could not set volume for ${soundKey}:`, volumeError);
    }

    // Stop other sounds if interrupt is true
    if (interrupt) {
      await stopAllSounds();
    }

    // Play the sound with fallback
    try {
      await sound.playAsync();
      console.log(`✅ Sound played successfully: ${type}`);
    } catch (playError) {
      console.error(`❌ Error playing sound ${soundKey}:`, playError);
      // Try alternative play method as fallback
      try {
        await sound.replayAsync();
        console.log(`✅ Sound played with fallback method: ${type}`);
      } catch (fallbackError) {
        console.error(`❌ Sound playback failed completely for ${soundKey}:`, fallbackError);
      }
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
  if (!settings.soundNotification || !settings.goalNotification) {
    console.log('🔇 Sound notifications disabled');
    return;
  }

  try {
    let soundToPlay;
    
    if (team === 'home') {
      soundToPlay = settings.homeTeamSound || 'Default';
    } else if (team === 'away') {
      soundToPlay = settings.awayTeamSound || 'Default';
    } else {
      // General goal sound (for 'general' team or unknown team)
      soundToPlay = settings.goalSound || 'Drum';
    }

    console.log(`⚽ Playing goal sound for "${team}" team: ${soundToPlay}`);
    await playSound(soundToPlay, 0.8, true); // Interrupt other sounds for goals
    
  } catch (error) {
    console.error(`❌ Error playing goal sound for ${team}:`, error);
  }
}

/**
 * Play red card sound with vibration support
 * @param {object} settings - Match settings from context
 */
export async function playRedCardSound(settings) {
  if (!settings.soundNotification || !settings.goalNotification || !settings.redCardSound) {
    console.log('🔇 Red card sound disabled');
    return;
  }

  try {
    console.log('🟥 Playing red card sound');
    await playSound('redcard', 1.0, true); // Full volume, interrupt other sounds
    
  } catch (error) {
    console.error('❌ Error playing red card sound:', error);
  }
}

/**
 * Play notification sound
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export async function playNotificationSound(volume = 0.7) {
  try {
    console.log('🔔 Playing notification sound');
    await playSound('notification', volume, false); // Don't interrupt other sounds
    
  } catch (error) {
    console.error('❌ Error playing notification sound:', error);
  }
}

/**
 * Test sound playback (useful for settings screen)
 * @param {string} soundName - Name of sound to test
 */
export async function testSound(soundName) {
  try {
    console.log(`🧪 Testing sound: ${soundName}`);
    await playSound(soundName, 0.8, true);
    
  } catch (error) {
    console.error(`❌ Error testing sound ${soundName}:`, error);
  }
}

/**
 * Stop all currently playing sounds
 */
export async function stopAllSounds() {
  try {
    for (const [key, sound] of soundCache.entries()) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.stopAsync();
        }
      } catch (error) {
        console.warn(`⚠️ Error stopping sound ${key}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error stopping all sounds:', error);
  }
}

/**
 * Clean up sound cache (call on app cleanup)
 */
export async function cleanupSounds() {
  try {
    console.log('🧹 Cleaning up sound cache');
    
    for (const [key, sound] of soundCache.entries()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn(`⚠️ Error unloading sound ${key}:`, error);
      }
    }
    
    soundCache.clear();
    isAudioConfigured = false;
    
    console.log('✅ Sound cache cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up sounds:', error);
  }
}

/**
 * Get available sound options for settings
 */
export function getAvailableSounds() {
  return [
    'Default',
    'Whistle', 
    'Drum',
    'Broadcast',
    'Horn',
    'Victory',
  ];
}

/**
 * Preload sounds for better performance
 */
export async function preloadSounds() {
  try {
    console.log('🚀 Preloading sounds for better performance...');
    
    await configureAudio();
    
    // Preload most commonly used sounds
    const commonSounds = ['default', 'drum', 'whistle', 'notification'];
    
    for (const soundKey of commonSounds) {
      try {
        if (!soundCache.has(soundKey) && sounds[soundKey]) {
          const { sound } = await Audio.Sound.createAsync(
            sounds[soundKey],
            { shouldPlay: false, volume: 0.1 }
          );
          soundCache.set(soundKey, sound);
        }
      } catch (error) {
        console.warn(`⚠️ Could not preload sound ${soundKey}:`, error);
      }
    }
    
    console.log(`✅ Preloaded ${soundCache.size} sounds`);
  } catch (error) {
    console.error('❌ Error preloading sounds:', error);
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