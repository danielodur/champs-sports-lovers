import { Platform } from "react-native";

// Static sound file imports
const SOUND_FILES = {
  default: require("../assets/sounds/sounds/Default.wav"),
  whistle: require("../assets/sounds/sounds/whistle.mp3"),
  drum: require("../assets/sounds/sounds/Drum.mp3"),
  broadcast: require("../assets/sounds/sounds/Broadcast.mp3"),
  redcard: require("../assets/sounds/sounds/red card sound.mp3"),
  notification: require("../assets/sounds/sounds/notification.mp3"),
};

// Audio types for better type safety
export interface AudioContent {
  source: any;
  volume?: number;
  shouldLoop?: boolean;
  rate?: number;
}

export interface AudioConfig {
  allowsRecordingIOS?: boolean;
  playsInSilentModeIOS?: boolean;
  staysActiveInBackground?: boolean;
  shouldDuckAndroid?: boolean;
  playThroughEarpieceAndroid?: boolean;
}

export interface SoundStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis?: number;
  durationMillis?: number;
}

// Safe audio manager class
export class SafeAudio {
  private static instance: SafeAudio | null = null;
  private audio: any = null;
  private isAvailable: boolean = false;
  private initialized: boolean = false;
  private soundCache = new Map<string, any>();
  private isAudioConfigured: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): SafeAudio {
    if (!SafeAudio.instance) {
      SafeAudio.instance = new SafeAudio();
    }
    return SafeAudio.instance;
  }

  private initialize(): void {
    try {
      this.audio = require("expo-av").Audio;
      this.isAvailable = true;
      console.log("✅ SafeAudio: expo-av loaded successfully");
    } catch (error) {
      console.warn("⚠️ SafeAudio: expo-av not available:", error);
      this.isAvailable = false;
      this.audio = null;
    }
    this.initialized = true;
  }

  public isAudioAvailable(): boolean {
    return this.isAvailable && this.audio !== null;
  }

  private async configureAudio(): Promise<boolean> {
    if (this.isAudioConfigured || !this.isAudioAvailable()) {
      return this.isAudioConfigured;
    }

    try {
      const audioConfig: AudioConfig = {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      };

      // Add interruption modes if available
      const enhancedConfig = { ...audioConfig };
      if (this.audio.InterruptionModeIOS) {
        (enhancedConfig as any).interruptionModeIOS =
          this.audio.InterruptionModeIOS.DoNotMix;
      }
      if (this.audio.InterruptionModeAndroid) {
        (enhancedConfig as any).interruptionModeAndroid =
          this.audio.InterruptionModeAndroid.DoNotMix;
      }

      await this.audio.setAudioModeAsync(enhancedConfig);
      this.isAudioConfigured = true;
      console.log("✅ SafeAudio: Audio configured successfully");
      return true;
    } catch (error) {
      console.warn("⚠️ SafeAudio: Failed to configure audio:", error);

      // Try minimal configuration as fallback
      try {
        await this.audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        this.isAudioConfigured = true;
        console.log("✅ SafeAudio: Audio configured with minimal settings");
        return true;
      } catch (fallbackError) {
        console.warn(
          "⚠️ SafeAudio: Audio configuration failed completely:",
          fallbackError,
        );
        this.isAudioConfigured = true; // Prevent infinite retries
        return false;
      }
    }
  }

  public async createSoundAsync(
    source: any,
    initialStatus?: any,
  ): Promise<{ sound: any; status: any } | null> {
    if (!this.isAudioAvailable()) {
      console.warn("SafeAudio: createSoundAsync not available");
      return null;
    }

    try {
      await this.configureAudio();

      const defaultStatus = {
        shouldPlay: false,
        volume: 1.0,
        isLooping: false,
        ...initialStatus,
      };

      const result = await this.audio.Sound.createAsync(source, defaultStatus);
      console.log("✅ SafeAudio: Sound created successfully");
      return result;
    } catch (error) {
      console.error("❌ SafeAudio: Error creating sound:", error);
      return null;
    }
  }

  public async playSound(
    source: any,
    options?: {
      volume?: number;
      interrupt?: boolean;
      cache?: boolean;
      cacheKey?: string;
    },
  ): Promise<boolean> {
    if (!this.isAudioAvailable()) {
      console.warn("SafeAudio: Cannot play sound - audio not available");
      return false;
    }

    const {
      volume = 1.0,
      interrupt = false,
      cache = true,
      cacheKey = `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    } = options || {};

    try {
      await this.configureAudio();

      let sound: any;

      // Check cache first if caching is enabled
      if (cache && this.soundCache.has(cacheKey)) {
        sound = this.soundCache.get(cacheKey);
        // Reset to beginning if sound was previously played
        try {
          await sound.setPositionAsync(0);
        } catch (resetError) {
          console.warn(
            "⚠️ SafeAudio: Could not reset sound position:",
            resetError,
          );
        }
      } else {
        // Create new sound
        const result = await this.createSoundAsync(source, {
          shouldPlay: false,
          volume: volume,
          isLooping: false,
        });

        if (!result) {
          return false;
        }

        sound = result.sound;

        // Cache the sound if enabled and cache isn't too large
        if (cache && this.soundCache.size < 10) {
          this.soundCache.set(cacheKey, sound);
        }
      }

      // Set volume safely
      try {
        await sound.setVolumeAsync(volume);
      } catch (volumeError) {
        console.warn("⚠️ SafeAudio: Could not set volume:", volumeError);
      }

      // Stop other sounds if interrupt is requested
      if (interrupt) {
        await this.stopAllSounds();
      }

      // Play the sound
      await sound.playAsync();
      console.log("✅ SafeAudio: Sound played successfully");
      return true;
    } catch (error) {
      console.error("❌ SafeAudio: Error playing sound:", error);
      return false;
    }
  }

  public async getSoundStatus(sound: any): Promise<SoundStatus | null> {
    if (!this.isAudioAvailable() || !sound) {
      return null;
    }

    try {
      const status = await sound.getStatusAsync();
      return {
        isLoaded: status.isLoaded || false,
        isPlaying: status.isPlaying || false,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis,
      };
    } catch (error) {
      console.warn("⚠️ SafeAudio: Could not get sound status:", error);
      return null;
    }
  }

  public async stopSound(sound: any): Promise<boolean> {
    if (!this.isAudioAvailable() || !sound) {
      return false;
    }

    try {
      const status = await this.getSoundStatus(sound);
      if (status && status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
        console.log("✅ SafeAudio: Sound stopped successfully");
        return true;
      }
      return true;
    } catch (error) {
      console.warn("⚠️ SafeAudio: Error stopping sound:", error);
      return false;
    }
  }

  public async stopAllSounds(): Promise<void> {
    if (!this.isAudioAvailable()) {
      return;
    }

    try {
      const promises = [];
      for (const [key, sound] of this.soundCache.entries()) {
        promises.push(this.stopSound(sound));
      }
      await Promise.allSettled(promises);
      console.log("✅ SafeAudio: All sounds stopped");
    } catch (error) {
      console.error("❌ SafeAudio: Error stopping all sounds:", error);
    }
  }

  public async unloadSound(sound: any): Promise<boolean> {
    if (!this.isAudioAvailable() || !sound) {
      return false;
    }

    try {
      await sound.unloadAsync();
      console.log("✅ SafeAudio: Sound unloaded successfully");
      return true;
    } catch (error) {
      console.warn("⚠️ SafeAudio: Error unloading sound:", error);
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    if (!this.isAudioAvailable()) {
      return;
    }

    try {
      console.log("🧹 SafeAudio: Cleaning up audio resources");

      const promises = [];
      for (const [key, sound] of this.soundCache.entries()) {
        promises.push(this.unloadSound(sound));
      }

      await Promise.allSettled(promises);
      this.soundCache.clear();
      this.isAudioConfigured = false;

      console.log("✅ SafeAudio: Cleanup completed");
    } catch (error) {
      console.error("❌ SafeAudio: Error during cleanup:", error);
    }
  }

  public getCacheSize(): number {
    return this.soundCache.size;
  }

  public clearCache(): void {
    this.soundCache.clear();
    console.log("🗑️ SafeAudio: Cache cleared");
  }

  // Static convenience methods
  public static async playSound(
    source: any,
    options?: { volume?: number; interrupt?: boolean },
  ): Promise<boolean> {
    return SafeAudio.getInstance().playSound(source, options);
  }

  public static async stopAllSounds(): Promise<void> {
    return SafeAudio.getInstance().stopAllSounds();
  }

  public static async cleanup(): Promise<void> {
    return SafeAudio.getInstance().cleanup();
  }

  public static isAvailable(): boolean {
    return SafeAudio.getInstance().isAudioAvailable();
  }
}

// Sound Manager class for game-specific sounds
export class SafeSoundManager {
  private static instance: SafeSoundManager | null = null;
  public safeAudio: SafeAudio;
  private sounds: { [key: string]: any } = {};
  private soundMapping: { [key: string]: string } = {};

  private constructor() {
    this.safeAudio = SafeAudio.getInstance();
    this.initializeSounds();
  }

  public static getInstance(): SafeSoundManager {
    if (!SafeSoundManager.instance) {
      SafeSoundManager.instance = new SafeSoundManager();
    }
    return SafeSoundManager.instance;
  }

  private initializeSounds(): void {
    if (!this.safeAudio.isAudioAvailable()) {
      console.warn(
        "SafeSoundManager: Audio not available, sounds will be disabled",
      );
      return;
    }

    try {
      // Sound file mappings - using static imports
      this.sounds = {};
      this.loadSoundSafely("default", SOUND_FILES.default);
      this.loadSoundSafely("whistle", SOUND_FILES.whistle);
      this.loadSoundSafely("drum", SOUND_FILES.drum);
      this.loadSoundSafely("broadcast", SOUND_FILES.broadcast);
      this.loadSoundSafely("redcard", SOUND_FILES.redcard);
      this.loadSoundSafely("notification", SOUND_FILES.notification);

      // Sound mapping for settings values to actual sound keys
      this.soundMapping = {
        Default: "default",
        Whistle: "whistle",
        Drum: "drum",
        Broadcast: "broadcast",
        Horn: "notification", // Using notification.mp3 as horn sound
        Victory: "drum", // Using drum.mp3 as victory sound
        Notification: "notification",
        "Red Card": "redcard",
      };

      console.log(
        `✅ SafeSoundManager: Initialized with ${Object.keys(this.sounds).length} sounds`,
      );
    } catch (error) {
      console.warn("⚠️ SafeSoundManager: Error initializing sounds:", error);
    }
  }

  private loadSoundSafely(key: string, soundFile: any): void {
    try {
      this.sounds[key] = soundFile;
    } catch (error) {
      console.warn(`⚠️ SafeSoundManager: Could not load sound ${key}:`, error);
    }
  }

  public async playSound(
    type: string = "default",
    volume: number = 1.0,
    interrupt: boolean = false,
  ): Promise<boolean> {
    if (!this.safeAudio.isAudioAvailable()) {
      console.warn("SafeSoundManager: Audio not available");
      return false;
    }

    try {
      // Map setting names to sound keys
      const soundKey = this.soundMapping[type] || type.toLowerCase();

      // Validate sound exists
      if (!this.sounds[soundKey]) {
        console.warn(
          `⚠️ SafeSoundManager: Sound not found: ${type} (mapped to: ${soundKey})`,
        );
        return false;
      }

      console.log(`🔊 SafeSoundManager: Playing sound: ${type} (${soundKey})`);

      return await this.safeAudio.playSound(this.sounds[soundKey], {
        volume,
        interrupt,
        cache: true,
        cacheKey: soundKey,
      });
    } catch (error) {
      console.error(`❌ SafeSoundManager: Error playing sound ${type}:`, error);
      return false;
    }
  }

  public async playGoalSound(team: string, settings: any): Promise<boolean> {
    if (!settings?.soundNotification || !settings?.goalNotification) {
      console.log("🔇 SafeSoundManager: Sound notifications disabled");
      return false;
    }

    try {
      let soundToPlay: string;

      if (team === "home") {
        soundToPlay = settings.homeTeamSound || "Default";
      } else if (team === "away") {
        soundToPlay = settings.awayTeamSound || "Default";
      } else {
        soundToPlay = settings.goalSound || "Drum";
      }

      console.log(
        `⚽ SafeSoundManager: Playing goal sound for "${team}" team: ${soundToPlay}`,
      );
      return await this.playSound(soundToPlay, 0.8, true);
    } catch (error) {
      console.error(
        `❌ SafeSoundManager: Error playing goal sound for ${team}:`,
        error,
      );
      return false;
    }
  }

  public async playRedCardSound(settings: any): Promise<boolean> {
    if (
      !settings?.soundNotification ||
      !settings?.goalNotification ||
      !settings?.redCardSound
    ) {
      console.log("🔇 SafeSoundManager: Red card sound disabled");
      return false;
    }

    try {
      console.log("🟥 SafeSoundManager: Playing red card sound");
      return await this.playSound("redcard", 1.0, true);
    } catch (error) {
      console.error(
        "❌ SafeSoundManager: Error playing red card sound:",
        error,
      );
      return false;
    }
  }

  public async playNotificationSound(volume: number = 0.7): Promise<boolean> {
    try {
      console.log("🔔 SafeSoundManager: Playing notification sound");
      return await this.playSound("notification", volume, false);
    } catch (error) {
      console.error(
        "❌ SafeSoundManager: Error playing notification sound:",
        error,
      );
      return false;
    }
  }

  public async testSound(soundName: string): Promise<boolean> {
    try {
      console.log(`🧪 SafeSoundManager: Testing sound: ${soundName}`);
      return await this.playSound(soundName, 0.8, true);
    } catch (error) {
      console.error(
        `❌ SafeSoundManager: Error testing sound ${soundName}:`,
        error,
      );
      return false;
    }
  }

  public async stopAllSounds(): Promise<void> {
    return this.safeAudio.stopAllSounds();
  }

  public async cleanup(): Promise<void> {
    return this.safeAudio.cleanup();
  }

  public getAvailableSounds(): string[] {
    return ["Default", "Whistle", "Drum", "Broadcast", "Horn", "Victory"];
  }

  public async preloadSounds(): Promise<void> {
    if (!this.safeAudio.isAudioAvailable()) {
      console.warn(
        "SafeSoundManager: Cannot preload sounds - audio not available",
      );
      return;
    }

    try {
      console.log("🚀 SafeSoundManager: Preloading sounds...");

      const commonSounds = ["default", "drum", "whistle", "notification"];
      let preloadedCount = 0;

      for (const soundKey of commonSounds) {
        if (this.sounds[soundKey]) {
          const success = await this.safeAudio.playSound(
            this.sounds[soundKey],
            {
              volume: 0.01, // Very low volume for preloading
              interrupt: false,
              cache: true,
              cacheKey: soundKey,
            },
          );
          if (success) {
            preloadedCount++;
          }
        }
      }

      console.log(`✅ SafeSoundManager: Preloaded ${preloadedCount} sounds`);
    } catch (error) {
      console.error("❌ SafeSoundManager: Error preloading sounds:", error);
    }
  }
}

// Export singleton instance for convenience
export const safeAudio = SafeAudio.getInstance();
export const safeSoundManager = SafeSoundManager.getInstance();

// Export common audio utilities
export const AudioUtils = {
  // Check if audio is supported on this platform
  isSupported: (): boolean => SafeAudio.isAvailable(),

  // Play a sound file
  playSound: (
    source: any,
    options?: { volume?: number; interrupt?: boolean },
  ): Promise<boolean> => SafeAudio.playSound(source, options),

  // Stop all sounds
  stopAllSounds: (): Promise<void> => SafeAudio.stopAllSounds(),

  // Cleanup audio resources
  cleanup: (): Promise<void> => SafeAudio.cleanup(),

  // Get the singleton instance for advanced usage
  getInstance: (): SafeAudio => SafeAudio.getInstance(),
};

// Export sound manager utilities
export const SoundUtils = {
  // Check if sounds are available
  isAvailable: (): boolean => safeSoundManager.safeAudio.isAudioAvailable(),

  // Play game sounds
  playGoal: (team: string, settings: any): Promise<boolean> =>
    safeSoundManager.playGoalSound(team, settings),

  playRedCard: (settings: any): Promise<boolean> =>
    safeSoundManager.playRedCardSound(settings),

  playNotification: (volume?: number): Promise<boolean> =>
    safeSoundManager.playNotificationSound(volume),

  testSound: (soundName: string): Promise<boolean> =>
    safeSoundManager.testSound(soundName),

  // Get available sounds
  getAvailableSounds: (): string[] => safeSoundManager.getAvailableSounds(),

  // Preload sounds for better performance
  preloadSounds: (): Promise<void> => safeSoundManager.preloadSounds(),

  // Get the singleton instance
  getInstance: (): SafeSoundManager => SafeSoundManager.getInstance(),
};

// Default export
export default SafeAudio;
