import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, KeyboardAvoidingView, Alert, Keyboard, ActionSheetIOS, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X, Camera, FileCheck, Clock } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

const MAX_CHAR_LIMIT = 200;

export default function ComplaintsAndFeedbackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [selectedProblemType, setSelectedProblemType] = useState('other');
  const [problemDetails, setProblemDetails] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const problemTypes = [
    { id: 'other', label: t('Other') },
    { id: 'expert-account', label: t('Expert Account') },
    { id: 'account', label: t('Account') },
    { id: 'page-optimization', label: t('Page Optimization') },
    { id: 'info-correction', label: t('Information Correction') },
  ];

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access in your device settings to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please allow photo library access in your device settings to select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openPhotoLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.log('Photo library error:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const handleImageUpload = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Photo Library', 'Take Photo'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openPhotoLibrary();
          } else if (buttonIndex === 2) {
            openCamera();
          }
        }
      );
    } else {
      // Android
      Alert.alert(
        'Add Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Photo Library', onPress: openPhotoLibrary },
          { text: 'Take Photo', onPress: openCamera },
        ]
      );
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    // Validate required fields
    if (!problemDetails.trim()) {
      Alert.alert('Error', 'Please describe your problem');
      return;
    }

    console.log('Submitting feedback:', {
      problemType: selectedProblemType,
      problemDetails,
      phoneNumber,
      images: selectedImages,
    });

    Alert.alert(
      'Success',
      'Your feedback has been submitted successfully. We will review it and get back to you soon.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Complaints & Feedback
        </Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => router.push('/help-center/client-feedback-records')}
          activeOpacity={0.8}
        >
          <View style={styles.processingIconContainer}>
            <FileCheck size={20} color={theme.colors.text} />
            <View style={styles.clockOverlay}>
              <Clock size={12} color="#666666" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Problem Type Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.requiredAsterisk}>*</Text>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Problem Type
              </Text>
            </View>

            <View style={styles.problemTypesContainer}>
              {problemTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.problemTypeButton,
                    {
                      backgroundColor: selectedProblemType === type.id 
                        ? theme.colors.primary 
                        : theme.colors.backgroundSecondary,
                    }
                  ]}
                  onPress={() => setSelectedProblemType(type.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.problemTypeText,
                      {
                        color: selectedProblemType === type.id 
                          ? '#FFFFFF' 
                          : theme.colors.text,
                      }
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Problem Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithCount}>
              <View style={styles.sectionHeader}>
                <Text style={styles.requiredAsterisk}>*</Text>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Problem Details
                </Text>
              </View>
              <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                {problemDetails.length}/{MAX_CHAR_LIMIT}
              </Text>
            </View>

            <View style={[styles.detailsInputContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <TextInput
                style={[
                  styles.detailsInput,
                  { 
                    color: theme.colors.text,
                  }
                ]}
                placeholder="Please describe your problem in detail, you can attach images for explanation"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={6}
                maxLength={MAX_CHAR_LIMIT}
                value={problemDetails}
                onChangeText={setProblemDetails}
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
              />

              {/* Image Upload Section */}
              <View style={styles.imageUploadSection}>
                {/* Display Selected Images */}
                {selectedImages.map((imageUri, index) => (
                  <View key={index} style={styles.selectedImageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Add Image Button */}
                {selectedImages.length < 3 && (
                  <TouchableOpacity 
                    style={styles.imageUploadButton}
                    onPress={handleImageUpload}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.imageUploadIconContainer, { backgroundColor: theme.colors.background }]}>
                      <Camera size={32} color={theme.colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Contact
            </Text>

            <View style={styles.phoneNumberRow}>
              <Text style={[styles.phoneNumberLabel, { color: theme.colors.text }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.phoneNumberInput,
                  { 
                    color: theme.colors.text,
                    borderBottomColor: theme.colors.border,
                  }
                ]}
                placeholder="Please enter phone number"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                returnKeyType="done"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onFocus={() => {
                  // Scroll to make phone input visible when keyboard appears
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 250);
                }}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          {/* Extra spacing for better scrolling */}
          <View style={styles.extraSpacing} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.bottomContainer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              Submit Now
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  historyButton: {
    padding: 8,
  },
  processingIconContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  charCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  problemTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  problemTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  problemTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  detailsInputContainer: {
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  detailsInput: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    minHeight: 120,
    marginBottom: 12,
  },
  imageUploadSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageUploadButton: {
    alignSelf: 'flex-start',
  },
  imageUploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderStyle: 'dashed',
  },
  selectedImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    marginTop: 16,
    marginBottom: 32,
  },
  phoneNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  phoneNumberLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    width: 120,
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    minHeight: 50,
  },
  extraSpacing: {
    height: 120,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

