// Utility functions for user data with proper priority handling

declare global {
  var savedProfileData: any;
}

/**
 * Get current username with priority:
 * 1. Custom username from personal info (champsUsername)
 * 2. Auth username (if not default)
 * 3. Real name from personal info
 * 4. Default username from auth
 */
export const getCurrentUsername = (userInfo?: { username?: string } | null): string => {
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
 * Get current profile picture with priority:
 * 1. Saved profile picture from personal info
 * 2. Avatar from auth userInfo
 * 3. Generated avatar using current username
 */
export const getCurrentProfilePicture = (userInfo?: { username?: string; avatar?: string } | null): string => {
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
  // Generate consistent background colors for professional look
  const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
  const seedHash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorIndex = Math.abs(seedHash) % backgroundColors.length;
  const backgroundColor = backgroundColors[colorIndex];
  
  // Use DiceBear adventurer style for realistic professional avatars
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&size=160`;
};