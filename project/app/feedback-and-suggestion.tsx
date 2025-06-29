import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Image,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Camera, 
  X,
  FileText,
  Zap,
  Target,
  User,
  Monitor,
  AlertCircle,
  Send,
  Clock,
  Check,
  FileCheck
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface ProblemType {
  id: string;
  label: string;
  icon: any;
  color: string;
}

export default function FeedbackAndSuggestionScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [selectedProblemType, setSelectedProblemType] = useState('other');
  const [problemDetails, setProblemDetails] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problemTypes: ProblemType[] = [
    {
      id: 'other',
      label: 'Other',
      icon: FileText,
      color: '#EF5350'
    },
    {
      id: 'prediction-number',
      label: 'Prediction Number',
      icon: Target,
      color: '#2196F3'
    },
    {
      id: 'lightning-number',
      label: 'Lightning Number',
      icon: Zap,
      color: '#FF9800'
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      color: '#4CAF50'
    },
    {
      id: 'page-optimization',
      label: 'Page Optimization',
      icon: Monitor,
      color: '#9C27B0'
    },
    {
      id: 'information-correction',
      label: 'Information Correction',
      icon: AlertCircle,
      color: '#607D8B'
    }
  ];

  const handleImageUpload = () => {
    // In a real app, this would open camera/gallery
    Alert.alert(
      'Add Image',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() }
      ]
    );
  };

  const openCamera = () => {
    // Camera functionality would be implemented here
    console.log('Opening camera...');
    Alert.alert('Camera', 'Camera functionality would open here');
  };

  const openGallery = () => {
    // Gallery functionality would be implemented here
    console.log('Opening gallery...');
    Alert.alert('Gallery', 'Gallery functionality would open here');
  };

  const removeImage = (index: number) => {
    const newImages = attachedImages.filter((_, i) => i !== index);
    setAttachedImages(newImages);
  };

  const validateForm = (): boolean => {
    if (!problemDetails.trim()) {
      Alert.alert('Error', 'Please describe your problem in detail');
      return false;
    }

    if (problemDetails.length < 10) {
      Alert.alert('Error', 'Please provide more details about your problem (minimum 10 characters)');
      return false;
    }

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    // Basic phone number validation
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const feedbackData = {
        problemType: selectedProblemType,
        details: problemDetails,
        phoneNumber: phoneNumber || null,
        images: attachedImages,
        timestamp: new Date().toISOString()
      };

      console.log('Feedback submitted:', feedbackData);
      
      Alert.alert(
        'Success',
        'Your feedback has been submitted successfully. We will review it and get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedProblemType('other');
              setProblemDetails('');
              setPhoneNumber('');
              setAttachedImages([]);
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProblemTypes = () => (
    <View style={styles.problemTypesContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        * Problem Type
      </Text>
      <View style={styles.problemTypesGrid}>
        {problemTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.problemTypeButton,
              {
                backgroundColor: selectedProblemType === type.id 
                  ? type.color 
                  : theme.colors.backgroundSecondary
              }
            ]}
            onPress={() => setSelectedProblemType(type.id)}
            activeOpacity={0.7}
          >
            <type.icon 
              size={16} 
              color={selectedProblemType === type.id ? '#FFFFFF' : theme.colors.text} 
            />
            <Text style={[
              styles.problemTypeText,
              {
                color: selectedProblemType === type.id ? '#FFFFFF' : theme.colors.text
              }
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProblemDetails = () => (
    <View style={styles.problemDetailsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          * Problem Details
        </Text>
        <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
          {problemDetails.length}/200
        </Text>
      </View>
      
      <TextInput
        style={[
          styles.problemDetailsInput,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }
        ]}
        placeholder="Please describe your problem in detail, you can attach images for explanation"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        numberOfLines={4}
        maxLength={200}
        value={problemDetails}
        onChangeText={setProblemDetails}
        textAlignVertical="top"
      />
      
      <TouchableOpacity
        style={[styles.imageUploadButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        onPress={handleImageUpload}
        activeOpacity={0.7}
      >
        <Camera size={32} color={theme.colors.textSecondary} />
        <Text style={[styles.imageUploadText, { color: theme.colors.textSecondary }]}>
          Tap to add image
        </Text>
      </TouchableOpacity>

      {attachedImages.length > 0 && (
        <View style={styles.attachedImagesContainer}>
          {attachedImages.map((image, index) => (
            <View key={index} style={styles.attachedImageItem}>
              <Image source={{ uri: image }} style={styles.attachedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.contactInfoContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Contact Information
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
        Phone Number
      </Text>
      <TextInput
        style={[
          styles.phoneInput,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }
        ]}
        placeholder="Please enter your phone number"
        placeholderTextColor={theme.colors.textSecondary}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        maxLength={15}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Feedback & Suggestions
        </Text>
        <TouchableOpacity 
          style={styles.processingButton}
          activeOpacity={0.8}
          onPress={() => router.push('/processing-status')}
        >
          <View style={styles.processingIconContainer}>
            <FileCheck size={20} color={theme.colors.text} />
            <View style={styles.clockOverlay}>
              <Clock size={12} color="#666666" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProblemTypes()}
        {renderProblemDetails()}
        {renderContactInfo()}
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.submitButton, { opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Send size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Now'}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  editButton: {
    padding: 4,
  },
  processingButton: {
    padding: 8,
  },
  processingIconContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  clockOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  problemTypesContainer: {
    marginBottom: 24,
  },
  problemTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  problemTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  problemTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  problemDetailsContainer: {
    marginBottom: 24,
  },
  problemDetailsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
    marginBottom: 16,
  },
  imageUploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },
  imageUploadText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  attachedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  attachedImageItem: {
    position: 'relative',
  },
  attachedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF5350',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfoContainer: {
    marginBottom: 24,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  submitContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  submitButton: {
    backgroundColor: '#EF5350',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
}); 