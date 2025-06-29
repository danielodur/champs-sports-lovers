import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { X, Calendar, MapPin, User, Phone, Mail, Lock, Navigation, Search, Check, ChevronRight, Trash2, QrCode, Users, Quote } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
}

if (typeof global.savedProfileData === 'undefined') {
  global.savedProfileData = null;
}

export default function ProfilePageScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);


  // Initialize with saved data (in real app, this would come from AsyncStorage/API)
  // For now, we'll simulate loading saved data
  const [profileData, setProfileData] = useState({
    personalInfo: {
      profilePicture: '', // Will be loaded from saved data
      realName: '', // Will be loaded from saved data
      phoneNumber: '', // Will be loaded from saved data
      champsUsername: '', // Will be loaded from saved data
      qrCode: '', // Will be loaded from saved data
      gender: '', // Will be loaded from saved data
      quote: '', // Will be loaded from saved data
      email: '', // Will be loaded from saved data
      birthday: '', // Will be loaded from saved data
      location: '', // Will be loaded from saved data
    }
  });

  // State to track if data has been saved before
  const [hasSavedData, setHasSavedData] = useState(false);

  // Email validation state
  const [emailError, setEmailError] = useState('');

  // Load saved data when component mounts and when screen comes into focus
  React.useEffect(() => {
    loadSavedData();
  }, []);

  // Reload data when screen comes into focus (when returning from edit screens)
  useFocusEffect(
    React.useCallback(() => {
      loadSavedData();
    }, [])
  );

  // Load saved data when component mounts
  const loadSavedData = async () => {
    try {
      // In a real app, you would load from AsyncStorage like this:
      // const savedData = await AsyncStorage.getItem('profileData');
      // if (savedData) {
      //   const parsedData = JSON.parse(savedData);
      //   setProfileData(parsedData);
      //   setHasSavedData(true);
      // }
      
      // For demonstration, load from our simple in-memory storage
      if (global.savedProfileData) {
        console.log('Loading saved profile data:', global.savedProfileData);
        setProfileData(global.savedProfileData);
        setHasSavedData(true);
      } else {
        console.log('No saved profile data found');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Save data function
  const saveProfileData = async (dataToSave: typeof profileData) => {
    try {
      // In a real app, you would save to AsyncStorage like this:
      // await AsyncStorage.setItem('profileData', JSON.stringify(dataToSave));
      
      // For demonstration, save to our simple in-memory storage
      global.savedProfileData = { ...dataToSave };
      console.log('Saving profile data:', dataToSave);
      setHasSavedData(true);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    const updatedData = {
      ...profileData,
      personalInfo: {
        ...profileData.personalInfo,
        [field]: value
      }
    };
    
    setProfileData(updatedData);
    
    // Also save to global storage immediately for data persistence
    if (!global.savedProfileData) {
      global.savedProfileData = { personalInfo: {} };
    }
    if (!global.savedProfileData.personalInfo) {
      global.savedProfileData.personalInfo = {};
    }
    global.savedProfileData.personalInfo[field] = value;
  };

  // Phone number formatting for Uganda
  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Uganda phone number formatting
    if (cleaned.startsWith('256')) {
      // International format +256 XXX XXX XXX
      const match = cleaned.match(/^(256)(\d{3})(\d{3})(\d{3})$/);
      if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    } else if (cleaned.startsWith('0')) {
      // Local format 0XXX XXX XXX
      const match = cleaned.match(/^(0)(\d{3})(\d{3})(\d{3})$/);
      if (match) {
        return `${match[1]}${match[2]} ${match[3]} ${match[4]}`;
      }
    }
    
    // Return partially formatted number
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    
    return text; // Return original if doesn't match expected pattern
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    handleFieldChange('phoneNumber', formatted);
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    handleFieldChange('email', text);
    
    if (text && !validateEmail(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Clear field functions
  const clearField = (field: string) => {
    handleFieldChange(field, '');
    if (field === 'email') {
      setEmailError('');
    }
  };

  // Function to mask phone number for security (e.g., 0772***010)
  const maskPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters first
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length >= 7) {
      // For numbers like 0772123456 -> 0772***456
      // Show first 4 digits, mask middle 3 with ***, show last 3
      const firstPart = cleanPhone.slice(0, 4);
      const lastPart = cleanPhone.slice(-3);
      return `${firstPart}***${lastPart}`;
    } else if (cleanPhone.length >= 4) {
      // For shorter numbers, just mask the middle part
      const firstPart = cleanPhone.slice(0, 4);
      return `${firstPart}***`;
    }
    
    // If too short, return as is
    return phoneNumber;
  };

  const formatDateToDDMMMYYYY = (date: Date) => {
    const day = date.getDate().toString();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  const parseDateFromDDMMMYYYY = (dateString: string) => {
    if (!dateString) return new Date();
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.findIndex(m => m === parts[1]);
      const year = parseInt(parts[2], 10);
      if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    return new Date();
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setTempDate(date);
    }
  };

  // Function to calculate age from date of birth
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const openDatePicker = () => {
    const currentYear = new Date().getFullYear();
    const initialDate = profileData.personalInfo.birthday 
      ? parseDateFromDDMMMYYYY(profileData.personalInfo.birthday)
      : new Date(currentYear - 25, 0, 1); // Default to 25 years ago
    setSelectedDate(initialDate);
    setTempDate(initialDate);
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    // Calculate age from selected date
    const age = calculateAge(tempDate);
    
    // Validate minimum age requirement
    if (age < 18) {
      Alert.alert(
        'Age Requirement Not Met',
        'Sorry, you must be 18+ to register.',
        [
          {
            text: 'OK',
            style: 'destructive',
            onPress: () => {
              // Keep the date picker open so user can select a different date
            }
          }
        ],
        { cancelable: false }
      );
      return; // Don't proceed with date selection
    }
    
    // If age is valid, proceed with date selection
    setSelectedDate(tempDate);
    const formattedDate = formatDateToDDMMMYYYY(tempDate);
    handleFieldChange('birthday', formattedDate);
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  const handleQRCodeNavigation = () => {
    // Generate a QR code value if none exists
    if (!profileData.personalInfo.qrCode) {
      const qrCodeValue = `CHP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      handleFieldChange('qrCode', qrCodeValue);
    }
    router.push('/my-qr-code');
  };

  const handleGenderNavigation = () => {
    router.push('/gender-selection');
  };

  const handleQuoteNavigation = () => {
    router.push('/quote-edit');
  };

  const handleRealNameNavigation = () => {
    router.push('/real-name-edit');
  };

  const handlePhoneNumberNavigation = () => {
    router.push('/phone-number-edit');
  };

  const handleChampsUsernameNavigation = () => {
    router.push('/champs-username-edit');
  };

  const handleEmailNavigation = () => {
    router.push('/email-edit');
  };

  const handleBirthdayNavigation = () => {
    router.push('/birthday-edit');
  };

  const handleLocationNavigation = () => {
    router.push('/location-edit');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all associated data. This action cannot be undone.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement actual account deletion logic here
                    Alert.alert(
                      'Account Deletion',
                      'Account deletion functionality is not yet implemented. Please contact support for assistance.',
                      [{ text: 'OK' }]
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };



  const handleLocationSelection = () => {
    setShowLocationModal(true);
    setSelectedLocation(profileData.personalInfo.location || '');
  };

  const handleSave = async () => {
    // Check for email validation error (only if email is provided)
    if (profileData.personalInfo.email && emailError) {
      Alert.alert(
        'Invalid Email', 
        'Please enter a valid email address',
        [{ text: 'OK' }]
      );
      return;
    }

    // Save the data
    const success = await saveProfileData(profileData);
    
    if (success) {
      // Check if all important fields are filled for success message
      const importantFields = ['realName', 'phoneNumber', 'email', 'birthday'];
      const filledFields = importantFields.filter(field => profileData.personalInfo[field as keyof typeof profileData.personalInfo]);
      
      if (filledFields.length === importantFields.length) {
        Alert.alert(
          'Profile Created Successfully!', 
          'Your profile has been successfully created with all important information.',
          [{ 
            text: 'OK', 
            onPress: () => router.back() // Navigate back to profile page
          }]
        );
      } else {
        Alert.alert(
          'Profile Saved', 
          'Your profile information has been saved. You can complete the remaining fields anytime.',
          [{ 
            text: 'OK', 
            onPress: () => router.back() // Navigate back to profile page
          }]
        );
      }
    } else {
      Alert.alert(
        'Error', 
        'Failed to save your profile information. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Complete Uganda Districts Array (146 districts)
  const UGANDA_DISTRICTS = [
    'Abim', 'Adjumani', 'Agago', 'Alebtong', 'Amolatar', 'Amudat', 'Amuria', 'Amuru', 'Apac', 'Arua',
    'Budaka', 'Bududa', 'Bugiri', 'Bugweri', 'Buhweju', 'Buikwe', 'Bukedea', 'Bukomansimbi', 'Bukwo',
    'Bulambuli', 'Buliisa', 'Bundibugyo', 'Bunyangabu', 'Bushenyi', 'Busia', 'Butaleja', 'Butambala',
    'Butebo', 'Buvuma', 'Buyende', 'Dokolo', 'Gomba', 'Gulu', 'Gwanda', 'Hoima', 'Ibanda', 'Iganga',
    'Isingiro', 'Jinja', 'Kaabong', 'Kabale', 'Kabarole', 'Kaberamaido', 'Kagadi', 'Kakumiro',
    'Kalaki', 'Kalangala', 'Kaliro', 'Kalungu', 'Kampala', 'Kamuli', 'Kamwenge', 'Kanungu',
    'Kapchorwa', 'Kapelebyong', 'Karenga', 'Kasanda', 'Kasese', 'Katakwi', 'Kayunga', 'Kazo',
    'Kibaale', 'Kiboga', 'Kibuku', 'Kikuube', 'Kiruhura', 'Kiryandongo', 'Kisoro', 'Kitagwenda',
    'Kitgum', 'Koboko', 'Kole', 'Kotido', 'Kumi', 'Kwania', 'Kween', 'Kyankwanzi', 'Kyegegwa',
    'Kyenjojo', 'Kyotera', 'Lamwo', 'Lira', 'Luuka', 'Luwero', 'Lwengo', 'Lyantonde', 'Madi-Okollo',
    'Manafwa', 'Maracha', 'Masaka', 'Masindi', 'Mayuge', 'Mbale', 'Mbarara', 'Mitooma', 'Mityana',
    'Moroto', 'Moyo', 'Mpigi', 'Mubende', 'Mukono', 'Nabilatuk', 'Nakapiripirit', 'Nakaseke',
    'Nakasongola', 'Namayingo', 'Namisindwa', 'Namutumba', 'Napak', 'Nebbi', 'Ngora', 'Ntoroko',
    'Ntungamo', 'Nwoya', 'Obongi', 'Omoro', 'Otuke', 'Oyam', 'Pader', 'Pakwach', 'Pallisa',
    'Rakai', 'Rubanda', 'Rubirizi', 'Rukiga', 'Rukungiri', 'Rwampara', 'Sembabule', 'Serere',
    'Sheema', 'Sironko', 'Soroti', 'Terego', 'Tororo', 'Twesigye', 'Wakiso', 'Yumbe', 'Zombo'
  ].sort();

  const filteredDistricts = UGANDA_DISTRICTS.filter(district =>
    district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentLocation = async () => {
    setIsDetectingLocation(true);
    
    try {
      // Check permissions first
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to detect your current location.');
        setIsDetectingLocation(false);
        return;
      }

      // Try to get location with progressively less strict requirements
      let location;
      
      try {
        // First attempt: Balanced accuracy with reasonable timeout
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (firstError) {
        console.log('Balanced accuracy failed, trying low accuracy:', firstError);
        
        try {
          // Second attempt: Low accuracy (faster)
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        } catch (secondError) {
          console.log('Low accuracy failed, trying last known:', secondError);
          
          // Third attempt: Get last known position
          location = await Location.getLastKnownPositionAsync({
            maxAge: 600000, // Accept location up to 10 minutes old
            requiredAccuracy: 1000, // Accept accuracy within 1km
          });
          
          if (!location) {
            throw new Error('No location available');
          }
        }
      }

      // Now try reverse geocoding with fallback
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          
          const district = address.city || address.region || address.subregion;
          const country = address.country;
          
          let locationString = '';
          if (district && country) {
            // Quick district matching
            const matchingDistrict = UGANDA_DISTRICTS.find(d => 
              d.toLowerCase() === district.toLowerCase()
            );
            
            if (matchingDistrict) {
              locationString = `${matchingDistrict}, ${country}`;
            } else {
              locationString = `${district}, ${country}`;
            }
          } else if (country) {
            locationString = country;
          } else {
            locationString = 'Location detected';
          }
          
          setCurrentLocation(locationString);
          setSelectedLocation(locationString);
        } else {
          throw new Error('No geocoding results');
        }
      } catch (geocodeError) {
        console.log('Geocoding failed, using coordinate fallback:', geocodeError);
        
        // Fallback: Use coordinates to determine approximate location
        const { latitude, longitude } = location.coords;
        
        if (latitude >= -1.5 && latitude <= 4.2 && longitude >= 29.5 && longitude <= 35.0) {
          // Within Uganda bounds
          setCurrentLocation('Uganda');
          setSelectedLocation('Kampala, Uganda');
        } else {
          // Outside Uganda
          setCurrentLocation('Location detected');
          setSelectedLocation('Location detected');
        }
      }
    } catch (error) {
      console.log('All location methods failed:', error);
      Alert.alert('Location Error', 'Unable to detect your current location. Please ensure location services are enabled and try again, or select manually from the list.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedLocation(district + ', Uganda');
  };

  const handleLocationSave = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select your location');
      return;
    }

    handleFieldChange('location', selectedLocation);
    setShowLocationModal(false);
    setSearchQuery('');
    setCurrentLocation(null);
  };

  const handleLocationCancel = () => {
    setShowLocationModal(false);
    setSearchQuery('');
    setSelectedLocation(profileData.personalInfo.location || '');
    setCurrentLocation(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
          <View style={styles.innerContainer}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Profile</Text>
              <TouchableOpacity 
                onPress={handleSave}
                style={styles.saveButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.saveText, { color: theme.colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentInsetAdjustmentBehavior="automatic"
              bounces={true}
              alwaysBounceVertical={false}
              overScrollMode="never"
              scrollEventThrottle={16}
              decelerationRate="normal"
              nestedScrollEnabled={true}
            >
        {/* Personal Information Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.backgroundSecondary }]}>
          
          {/* Profile Picture */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => router.push('/profile-picture-edit')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <User size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Profile Picture
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.profilePicture && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  Added
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Real Name */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => router.push('/real-name-edit')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <User size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Real Name
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.realName && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  {profileData.personalInfo.realName}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Phone Number */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => router.push('/phone-number-edit')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Phone size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Phone Number
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.phoneNumber && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  {maskPhoneNumber(profileData.personalInfo.phoneNumber)}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Champs Username */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => router.push('/champs-username-edit')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <User size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                User Name
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.champsUsername && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  @{profileData.personalInfo.champsUsername}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* My QR Code */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleQRCodeNavigation}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <QrCode size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                My QR Code
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.qrCode && (
                <QrCode size={18} color={theme.colors.textSecondary} />
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Gender */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleGenderNavigation}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Users size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Gender
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.gender && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  {profileData.personalInfo.gender === 'male' ? 'Male' : 'Female'}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Quote */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleQuoteNavigation}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Quote size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Quote
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.quote && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {(() => {
                    const words = profileData.personalInfo.quote.split(' ');
                    if (words.length > 20) {
                      return `${words.slice(0, 20).join(' ')}...`;
                    }
                    return profileData.personalInfo.quote;
                  })()}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Lock size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                New Password
              </Text>
            </View>
            <View style={styles.rowRight}>
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => router.push('/email-edit')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Mail size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Email
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.email && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  {profileData.personalInfo.email}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Birthday */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={openDatePicker}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Calendar size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Date of Birth
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.birthday && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  {profileData.personalInfo.birthday}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Location */}
          <TouchableOpacity 
            style={[styles.singleRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleLocationSelection}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <MapPin size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Location
              </Text>
            </View>
            <View style={styles.rowRight}>
              {profileData.personalInfo.location && (
                <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
                  {profileData.personalInfo.location}
                </Text>
              )}
              <ChevronRight size={20} color="#9E9E9E" />
            </View>
          </TouchableOpacity>

          {/* Delete Account Button - Scrollable with content */}
          <View style={styles.deleteAccountContainerBottom}>
            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

        </View>
        
            </ScrollView>
          </View>
      </KeyboardAvoidingView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDateSelection}
        supportedOrientations={['portrait']}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.datePickerModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Date</Text>
              <TouchableOpacity
                onPress={cancelDateSelection}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <X size={20} color="#CC5555" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date(new Date().getFullYear() - 18, 11, 31)}
                  minimumDate={new Date(1940, 0, 1)}
                  textColor={theme.colors.text}
                  accentColor={theme.colors.primary}
                  style={styles.datePickerWheel}
                  themeVariant={theme.colors.background === '#121212' ? 'dark' : 'light'}
                  locale="en"
                />
              ) : (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date(new Date().getFullYear() - 18, 11, 31)}
                  minimumDate={new Date(1940, 0, 1)}
                  style={styles.datePickerWheel}
                  locale="en"
                />
              )}
            </View>

            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                onPress={confirmDateSelection}
                style={[styles.okButton, { backgroundColor: theme.colors.primary }]}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Check size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleLocationCancel}
      >
        <View style={styles.locationModalOverlay}>
          <View style={[styles.locationModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={[styles.locationModalHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity
                onPress={handleLocationCancel}
                style={styles.locationCancelButton}
                activeOpacity={0.7}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.locationModalTitle, { color: theme.colors.text }]}>Select Location</Text>
              <TouchableOpacity
                onPress={handleLocationSave}
                style={styles.locationSaveButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.locationSaveText, { color: theme.colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.locationModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.locationSection}>
                <Text style={[styles.locationSectionTitle, { color: theme.colors.text }]}>Current Location</Text>
                <TouchableOpacity
                  style={[styles.gpsButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  onPress={getCurrentLocation}
                  disabled={isDetectingLocation}
                  activeOpacity={0.7}
                >
                  <View style={styles.gpsButtonContent}>
                    {isDetectingLocation ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Navigation size={20} color={theme.colors.primary} />
                    )}
                    <Text style={[styles.gpsButtonText, { color: theme.colors.text }]}>
                      {isDetectingLocation ? 'Detecting Location...' : 'Use Current Location'}
                    </Text>
                  </View>
                  {currentLocation && !isDetectingLocation && (
                    <Check size={16} color="#4CAF50" />
                  )}
                </TouchableOpacity>
                
                {currentLocation && (
                  <View style={[styles.currentLocationDisplay, { backgroundColor: theme.colors.background }]}>
                    <MapPin size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.currentLocationText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {currentLocation}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.locationSection}>
                <Text style={[styles.locationSectionTitle, { color: theme.colors.text }]}>Uganda Districts</Text>
                
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Search size={16} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search districts..."
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <ScrollView style={styles.districtsList} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                  {filteredDistricts.map((district) => (
                    <TouchableOpacity
                      key={district}
                      style={[
                        styles.districtItem,
                        { 
                          borderBottomColor: theme.colors.border,
                          backgroundColor: selectedLocation.includes(district) ? 'rgba(79, 172, 254, 0.1)' : 'transparent'
                        }
                      ]}
                      onPress={() => handleDistrictSelect(district)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.districtText, 
                        { 
                          color: selectedLocation.includes(district) ? theme.colors.primary : theme.colors.text 
                        }
                      ]}>
                        {district}
                      </Text>
                      {selectedLocation.includes(district) && (
                        <Check size={16} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {selectedLocation && (
                <View style={[styles.selectedLocationSection, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.selectedLocationLabel, { color: theme.colors.textSecondary }]}>Selected:</Text>
                  <Text style={[styles.selectedLocationText, { color: theme.colors.primary }]}>
                    {selectedLocation}
                  </Text>
                </View>
              )}
            </ScrollView>
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
  innerContainer: {
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
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 80 : 60, // Bottom padding for proper scrolling
    paddingHorizontal: 0,
    flexGrow: 1,
  },
  section: {
    marginHorizontal: 0,
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 'auto',
  },
  infoRow: {
    flexDirection: 'column',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    minHeight: 60,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 32, // Exact same distance as icons from left (16px)
    minHeight: 44,
  },
  rightArrowButton: {
    padding: 4,
   
  },
  rightArrowButtonFixed: {
    padding: 12, // Increased padding for better touch sensitivity
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44, // Increased touch area for better sensitivity
    minHeight: 44, // Increased touch area for better sensitivity
    borderRadius: 8, // Small border radius for visual feedback
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    // Add hitSlop for better touch sensitivity
  },

  checkContainer: {
    marginLeft: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    flex: 1, // Back to flex: 1 for proper text layout
  },
  fieldValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 32,
    color: '#666',
  },
  infoInput: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  datePickerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    width: '90%',
    maxWidth: 420,
    minHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  datePickerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 280,
  },
  datePickerWheel: {
    width: '100%',
    height: 240,
    minHeight: 240,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  okButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 8,
    minWidth: 48,
    minHeight: 48,
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModal: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  locationCancelButton: {
    padding: 4,
  },
  locationModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  locationSaveButton: {
    padding: 4,
  },
  locationSaveText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  locationModalContent: {
    flex: 1,
    padding: 16,
  },
  locationSection: {
    marginBottom: 20,
  },
  locationSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gpsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  currentLocationDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  currentLocationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  districtsList: {
    maxHeight: 300,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  districtText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  selectedLocationSection: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedLocationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  selectedLocationText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  requiredStar: {
    color: '#EF5350',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  infoInputWithClear: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 44,
    minHeight: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  clearButton: {
    position: 'absolute',
    right: 14,
    top: 18,
    padding: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  emailErrorText: {
    color: '#EF5350',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 32,
  },
  deleteAccountContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  deleteAccountButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteAccountText: {
    color: '#EF5350',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  // Delete Account Button at Bottom
  deleteAccountContainerBottom: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for iPhone home indicator
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  deleteBackButton: {
    padding: 4,
  },
  deleteBackArrow: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'normal',
  },
  deleteCloseButton: {
    padding: 4,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  deleteCountdownContainer: {
    flex: 1,
    padding: 20,
  },
  deleteWarningIcon: {
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  deleteCardIcon: {
    width: 60,
    height: 80,
    backgroundColor: '#8B5A2B',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  cardIconHeader: {
    height: 12,
    backgroundColor: '#D4A574',
    borderRadius: 2,
  },
  cardIconBody: {
    height: 30,
    backgroundColor: '#D4A574',
    borderRadius: 2,
    marginVertical: 4,
  },
  cardIconFooter: {
    height: 8,
    backgroundColor: '#D4A574',
    borderRadius: 2,
  },
  warningTriangle: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 32,
    height: 32,
    backgroundColor: '#FF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningExclamation: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  deleteContentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 80,
  },
  deleteContentTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteRiskList: {
    gap: 16,
  },
  deleteRiskItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
  highlightText: {
    color: '#FF6B6B',
    fontFamily: 'Inter-SemiBold',
  },
  deleteCountdownButton: {
    backgroundColor: '#8B5A2B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 20,
  },
  deleteCountdownText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  deleteErrorContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  deleteErrorIcon: {
    marginBottom: 30,
    marginTop: 20,
  },
  deleteCardIconLarge: {
    width: 80,
    height: 100,
    backgroundColor: '#8B5A2B',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardIconHeaderLarge: {
    height: 16,
    backgroundColor: '#D4A574',
    borderRadius: 3,
  },
  cardIconBodyLarge: {
    height: 40,
    backgroundColor: '#D4A574',
    borderRadius: 3,
    marginVertical: 6,
  },
  cardIconFooterLarge: {
    height: 12,
    backgroundColor: '#D4A574',
    borderRadius: 3,
  },
  warningTriangleLarge: {
    position: 'absolute',
    right: -12,
    top: -12,
    width: 40,
    height: 40,
    backgroundColor: '#FF4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningExclamationLarge: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Inter-Bold',
  },
  deleteErrorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteErrorSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  deleteErrorList: {
    width: '100%',
    gap: 12,
  },
  deleteErrorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 16,
  },
  deleteErrorItemGray: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 16,
  },
  errorItemNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  errorItemNumberGray: {
    width: 24,
    height: 24,
    backgroundColor: '#666666',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  errorItemNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FF4444',
  },
  errorItemNumberTextGray: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  errorItemContent: {
    flex: 1,
  },
  errorItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  errorItemTitleGray: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#CCCCCC',
    marginBottom: 2,
  },
  errorItemDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  errorItemDescriptionGray: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999999',
  },
  errorItemArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorItemArrowGray: {
    fontSize: 18,
    color: '#666666',
    marginLeft: 8,
  },
  // Additional styles for updated countdown screen
  deleteTopCancelButton: {
    position: 'absolute',
    top: -10,
    left: 20,
    padding: 8,
    backgroundColor: 'rgba(102, 102, 102, 0.2)',
    borderRadius: 20,
    zIndex: 1,
  },
  deleteScrollContent: {
    flex: 1,
    marginBottom: 10,
  },
  deleteBottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  deleteCancelButton: {
    padding: 12,
    backgroundColor: 'rgba(102, 102, 102, 0.2)',
    borderRadius: 24,
  },
  deleteAcceptButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  deleteAcceptText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF4444',
  },
  // Updated styles for repositioned modal
  deleteModalContent: {
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerSpacer: {
    width: 32,
  },
  deleteBottomButtonsCorners: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  deleteBottomLeftButton: {
    padding: 12,
    backgroundColor: 'rgba(102, 102, 102, 0.3)',
    borderRadius: 24,
  },
  deleteBottomRightButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  iconDisplayContainer: {
    marginLeft: 8,
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderDisplayContainer: {
    marginLeft: 8,
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderDisplayText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  quotePreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginTop: 6,
    marginLeft: 32,
    lineHeight: 18,
  },
  fieldPreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 6,
    marginLeft: 32,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  atSymbol: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  // New styles for single row layout
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: 0, // Reduced from 16 to move icons/text more left
    paddingRight: 3, // Increased from 16 to move arrows more right
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
    minWidth: 100, // Ensure consistent width for labels
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 6, // Reduced from 8 to move text closer to icon
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 12, // Add space between left content and right content
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginRight: 12, // Increased from 8 to give more space from arrow
    textAlign: 'right',
    flex: 1, // Allow value to take available space
    maxWidth: 150, // Limit width to prevent overcrowding
  },
}); 