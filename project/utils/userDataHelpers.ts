// Utility functions for user data with Supabase integration
import { profileService } from '../services/profileService';
import { UserProfile } from '../services/authService';

// Legacy global storage (will be migrated)
declare global {
  var savedProfileData: any;
}

/**
 * Get current username with priority using Supabase profile data
 * Falls back to legacy method if profile not available
 */
export const getCurrentUsername = (
  userInfo?: { username?: string } | null, 
  userProfile?: UserProfile | null
): string => {
  // Use profileService method if profile is available
  if (userProfile !== undefined) {
    return profileService.getCurrentUsername(userProfile, userInfo);
  }
  
  // Legacy fallback method for backward compatibility
  // Priority 1: Custom username (champsUsername)
  if (global.savedProfileData?.personalInfo?.champsUsername) {
    return global.savedProfileData.personalInfo.champsUsername;
  }
  
  // Priority 2: Auth username (if not default)
  if (userInfo?.username && userInfo.username !== 'DefaultUser123' && !userInfo.username.startsWith('DefaultUser')) {
    return userInfo.username;
  }
  
  // Priority 3: Real name from personal info
  if (global.savedProfileData?.personalInfo?.realName) {
    return global.savedProfileData.personalInfo.realName;
  }
  
  // Priority 4: Default username from auth or fallback
  return userInfo?.username || 'DefaultUser123';
};

/**
 * Get current profile picture with priority using Supabase profile data
 * Falls back to legacy method if profile not available
 */
export const getCurrentProfilePicture = (
  userInfo?: { username?: string; avatar?: string } | null,
  userProfile?: UserProfile | null
): string => {
  // Use profileService method if profile is available
  if (userProfile !== undefined) {
    return profileService.getCurrentProfilePicture(userProfile, userInfo);
  }
  
  // Legacy fallback method for backward compatibility
  // Priority 1: Saved profile picture
  if (global.savedProfileData?.personalInfo?.profilePicture) {
    return global.savedProfileData.personalInfo.profilePicture;
  }
  
  // Priority 2: Avatar from auth
  if (userInfo?.avatar) {
    return userInfo.avatar;
  }
  
  // Priority 3: Generate avatar using current username
  const currentUsername = getCurrentUsername(userInfo);
  return generateProfessionalAvatar(currentUsername);
};

/**
 * Generate professional realistic avatar using DiceBear adventurer style
 */
export const generateProfessionalAvatar = (seed: string): string => {
  return profileService.generateProfessionalAvatar(seed);
};