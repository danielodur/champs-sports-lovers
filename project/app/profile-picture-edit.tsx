import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, User, Camera, Image as ImageIcon, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import useAuth from '@/hooks/useAuth';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
  var currentUserAvatar: string;
}

if (typeof global.savedProfileData === 'undefined') {
  global.savedProfileData = null;
}

export default function ProfilePictureEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { userInfo, setLoggedIn, isLoggedIn } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = () => {
    if (global.savedProfileData && global.savedProfileData.personalInfo && global.savedProfileData.personalInfo.profilePicture) {
      setSelectedImage(global.savedProfileData.personalInfo.profilePicture);
    }
  };

  const selectPictureOption = () => {
    console.log('🚀 selectPictureOption called - opening modal');
    setShowOptionModal(true);
    console.log('🚀 Modal state set to true');
  };

  const generateAvatar = async () => {
    try {
      setShowOptionModal(false);
      
      // Fast avatar generation - pre-selected popular styles for better performance
      const styles = ['avataaars', 'adventurer', 'personas', 'micah'];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      
      // Optimized seed generation - simpler and faster
      const timestamp = Date.now();
      const randomSeed = `${userInfo?.username || 'user'}_${timestamp}`;
      
      // Generate avatar URL instantly
      const avatarUrl = `https://api.dicebear.com/8.x/${randomStyle}/png?seed=${randomSeed}&backgroundColor=transparent&size=150`;
      
      // Set avatar immediately without validation (we control the URL generation)
      setSelectedImage(avatarUrl);
      setHasChanges(true);
    } catch (error) {
      console.error('Error generating avatar');
      Alert.alert('Error', 'Failed to generate avatar. Please check your internet connection and try again.');
    }
  };



  const chooseFromAlbum = async () => {
    console.log('📸 Starting photo selection process...');
    setShowOptionModal(false);
    
    // Show native iOS Alert asking for permission
    Alert.alert(
      'Photo Library Access',
      'We will now open your photo library. Please grant permission when prompted and select a photo.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('📸 User cancelled photo selection');
          }
        },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              console.log('📸 User confirmed, launching ImagePicker...');
              
              // Try the absolute most basic call possible
              const result = await ImagePicker.launchImageLibraryAsync();
              
              console.log('📸 ImagePicker returned!');
              console.log('📸 Canceled:', result.canceled);
              console.log('📸 Assets:', result.assets);
              
              if (result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                console.log('📸 Selected image URI:', imageUri);
                
                setSelectedImage(imageUri);
                setHasChanges(true);
              } else if (!result.canceled) {
                console.log('📸 No assets but not canceled');
                Alert.alert('No Photo', 'No photo was selected. Please try again.');
              }
            } catch (err) {
              console.error('📸 ImagePicker error:', err);
              const errMsg = err instanceof Error ? err.message : String(err);
              
              Alert.alert(
                'Photo Access Issue', 
                `Cannot access photos: ${errMsg}\n\nPlease:\n1. Go to Settings > Privacy & Security > Photos\n2. Find "Champs" app\n3. Select "All Photos"\n4. Return and try again`,
                [
                  {
                    text: 'Open Settings',
                    onPress: () => Linking.openURL('app-settings:')
                  },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }
          }
        }
      ]
    );
  };





  const handleSave = () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select or generate a profile picture before saving.');
      return;
    }

    try {
      console.log('Saving profile picture:', selectedImage);
      
      // Save the profile picture to shared storage
      if (!global.savedProfileData) {
        global.savedProfileData = { personalInfo: {} };
      }
      if (!global.savedProfileData.personalInfo) {
        global.savedProfileData.personalInfo = {};
      }
      global.savedProfileData.personalInfo.profilePicture = selectedImage;

      // Update the avatar in useAuth store to reflect across all screens
      if (isLoggedIn && userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          avatar: selectedImage, // Update the avatar that displays everywhere
          profilePicture: selectedImage // Additional field for consistency
        };
        setLoggedIn(true, updatedUserInfo);
        console.log('Updated user info with new avatar');
        console.log('New avatar set to:', selectedImage);
        console.log('User info username:', updatedUserInfo.username || 'No username');
      }

      // Also save to local storage for persistence (in real app, use AsyncStorage)
      try {
        // This would typically be AsyncStorage.setItem in a real app
        global.currentUserAvatar = selectedImage;
        console.log('Profile picture saved to global storage');
      } catch (storageError) {
        console.error('Failed to save to storage');
      }

      router.back();
    } catch (error) {
      console.error('Error saving profile picture');
      Alert.alert('Error', 'Failed to save profile picture. Please try again.');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const renderProfilePicture = () => {
    if (!selectedImage || selectedImage.trim() === '') {
      return (
        <View style={[styles.profilePicturePlaceholder, { backgroundColor: '#9E9E9E' }]}>
          <User size={64} color="#FFFFFF" />
        </View>
      );
    } 
    
    // Validate the image URI format
    const isValidHttpUrl = selectedImage.startsWith('http://') || selectedImage.startsWith('https://');
    const isValidFileUrl = selectedImage.startsWith('file://');
    const isValidDataUrl = selectedImage.startsWith('data:image/');
    const isValidContentUrl = selectedImage.startsWith('content://'); // Android
    const isValidPhUrl = selectedImage.startsWith('ph://'); // iOS Photos
    const isValidAssetsUrl = selectedImage.startsWith('assets-library://'); // iOS Assets
    
    if (isValidHttpUrl || isValidFileUrl || isValidDataUrl || isValidContentUrl || isValidPhUrl || isValidAssetsUrl) {
      // Valid URI format - render as image
      return (
        <Image 
          source={{ uri: selectedImage }} 
          style={styles.profilePictureImage}
          resizeMode="cover"
          onError={(error) => {
            console.error('Image loading error occurred');
            console.error('Error type:', typeof error);
            console.error('Error nativeEvent:', error?.nativeEvent || 'No nativeEvent');
            console.error('Image URI that failed:', selectedImage);
            console.error('Image URI length:', selectedImage.length);
            console.error('Image URI type:', typeof selectedImage);
            
            // Simple error logging without accessing complex properties
            console.error('Image failed to load - this is normal for invalid URLs');
            
            // Reset to placeholder on error
            setSelectedImage(null);
            Alert.alert('Image Error', 'Failed to load the selected image. Please try selecting a different image.');
          }}
          onLoad={() => {
            console.log('Profile picture loaded successfully:', selectedImage);
          }}
          onLoadStart={() => {
            console.log('Profile picture loading started:', selectedImage);
          }}
          onLoadEnd={() => {
            console.log('Profile picture loading ended');
          }}
        />
      );
    } else {
      // Invalid URI format - show placeholder and log warning
      console.warn('Invalid image URI format:', selectedImage);
      return (
        <View style={[styles.profilePicturePlaceholder, { backgroundColor: '#9E9E9E' }]}>
          <User size={64} color="#FFFFFF" />
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile Picture</Text>
          <TouchableOpacity 
            onPress={handleSave}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.saveText, { color: theme.colors.primary }]}>OK</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <User size={32} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Profile Picture</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Choose a profile picture to personalize your account
            </Text>
          </View>

          {/* Profile Picture Preview */}
          <View style={styles.profilePictureContainer}>
            <View style={[styles.profilePictureWrapper, { borderColor: theme.colors.border }]}>
              {renderProfilePicture()}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
              onPress={selectPictureOption}
              activeOpacity={0.7}
            >
              <Camera size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {selectedImage ? 'Change Picture' : 'Add Picture'}
              </Text>
            </TouchableOpacity>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Option Modal with Dull Grey Colors */}
      <Modal
        visible={showOptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.optionModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={[styles.optionModalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.optionModalTitle, { color: theme.colors.text }]}>Select Profile Picture</Text>
              <Text style={[styles.optionModalSubtitle, { color: theme.colors.textSecondary }]}>
                Choose how you'd like to add your profile picture
              </Text>
            </View>

            <View style={styles.optionButtonsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#D32F2F' }]}
                onPress={generateAvatar}
                activeOpacity={0.7}
              >
                <Text style={styles.optionButtonText}>✨ Generate Avatar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#E57373' }]}
                onPress={chooseFromAlbum}
                activeOpacity={0.7}
              >
                <Text style={styles.optionButtonText}>📸 Choose from Album</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, styles.optionCancelButton, { borderColor: '#9E9E9E' }]}
                onPress={() => setShowOptionModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionButtonText, { color: '#9E9E9E' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePictureWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profilePictureImage: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportEmoji: {
    fontSize: 64,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 60,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionModal: {
    width: '75%',
    maxWidth: 320,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  optionModalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  optionModalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  optionModalSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  optionButtonsContainer: {
    padding: 16,
    gap: 10,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  permissionModal: {
    width: '80%',
    maxWidth: 350,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 100, // Position it lower to avoid overlapping with Change Picture button
  },
  permissionModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  permissionModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButtonsContainer: {
    padding: 20,
    gap: 12,
  },
  permissionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});