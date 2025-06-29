import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Animated, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Crown, Gift, Clock, Users, MessageSquare, Bell, ClipboardList, ShoppingBag, User, Settings, ScanLine, Sun, MoonStar, SunMoon, Cog, Medal, Plus, Wallet, Flag, MapPin, TrendingUp, Calendar, LogIn, Menu, X, Headphones, Award, Share, AlertTriangle, QrCode, Grid3X3, Grid2X2, MoreHorizontal, AppWindow, UserPlus, Mail } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import ThemeSelector from '@/components/ThemeSelector';
import MoreFeaturesButton from '@/components/MoreFeaturesButton';
import { useTheme, useThemeMode } from '@/hooks/useTheme';
import { useMessages } from '@/contexts/MessagesContext';
import { useInvites } from '@/contexts/InvitesContext';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUsername, getCurrentProfilePicture } from '@/utils/userDataHelpers';

// Simple in-memory storage for demonstration (in real app, use AsyncStorage)
declare global {
  var savedProfileData: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Generate professional realistic avatar using Dicebear adventurer style
const generateProfessionalAvatar = (seed: string) => {
  // Generate consistent background colors for professional look
  const backgroundColors = ['ffdfbf', 'f0f0f0', 'e8f4fd', 'fff2e6', 'f8f8ff', 'f0fff0', 'fffacd', 'f5f5dc'];
  const seedHash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorIndex = Math.abs(seedHash) % backgroundColors.length;
  const backgroundColor = backgroundColors[colorIndex];
  
  // Use Dicebear adventurer style for realistic professional avatars
  const url = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&size=160`;
  console.log('Generated professional Dicebear avatar URL for', seed, ':', url);
  return url;
};

// Generate Champs ID - "CH" followed by 12 digits
const generateChampsId = () => {
  // Generate 12 random digits
  let digits = '';
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  
  // Return "CH" + 12 digits
  return `CH${digits}`;
};

// Generate IP Address based on location
const generateIPAddress = (location: string) => {
  // Map locations to IP ranges (comprehensive for Uganda districts and neighboring countries)
  const locationIPs: { [key: string]: string } = {
    // Uganda - Central Region
    'Kampala': '196.43.230.',
    'Wakiso': '196.43.231.',
    'Mukono': '196.43.232.',
    'Entebbe': '196.43.234.',
    'Mpigi': '196.43.241.',
    'Buikwe': '196.43.242.',
    'Gomba': '196.43.243.',
    'Kalangala': '196.43.244.',
    'Kalungu': '196.43.245.',
    'Kyotera': '196.43.246.',
    'Lwengo': '196.43.247.',
    'Masaka': '196.43.235.',
    'Rakai': '196.43.248.',
    
    // Uganda - Eastern Region
    'Jinja': '196.43.233.',
    'Mbale': '196.43.249.',
    'Tororo': '196.43.250.',
    'Soroti': '196.43.251.',
    'Busia': '196.43.252.',
    'Iganga': '196.43.253.',
    'Mayuge': '196.43.254.',
    'Bugiri': '196.44.1.',
    'Namutumba': '196.44.2.',
    'Pallisa': '196.44.3.',
    'Budaka': '196.44.4.',
    'Sironko': '196.44.5.',
    'Manafwa': '196.44.6.',
    'Kapchorwa': '196.44.7.',
    'Kumi': '196.44.8.',
    'Butaleja': '196.44.9.',
    
    // Uganda - Northern Region
    'Gulu': '196.43.237.',
    'Lira': '196.43.238.',
    'Arua': '196.43.239.',
    'Kitgum': '196.44.10.',
    'Pader': '196.44.11.',
    'Apac': '196.44.12.',
    'Oyam': '196.44.13.',
    'Dokolo': '196.44.14.',
    'Amolatar': '196.44.15.',
    'Alebtong': '196.44.16.',
    'Otuke': '196.44.17.',
    'Agago': '196.44.18.',
    'Lamwo': '196.44.19.',
    'Moyo': '196.44.20.',
    'Yumbe': '196.44.21.',
    'Adjumani': '196.44.22.',
    'Nebbi': '196.44.23.',
    'Zombo': '196.44.24.',
    'Pakwach': '196.44.25.',
    
    // Uganda - Western Region
    'Mbarara': '196.43.236.',
    'Fort Portal': '196.44.26.',
    'Kasese': '196.44.27.',
    'Kabale': '196.44.28.',
    'Hoima': '196.44.29.',
    'Masindi': '196.44.30.',
    'Bundibugyo': '196.44.31.',
    'Kabarole': '196.44.32.',
    'Kamwenge': '196.44.33.',
    'Kyenjojo': '196.44.34.',
    'Bushenyi': '196.44.35.',
    'Rubirizi': '196.44.36.',
    'Sheema': '196.44.37.',
    'Mitooma': '196.44.38.',
    'Ntungamo': '196.44.39.',
    'Rukungiri': '196.44.40.',
    'Kanungu': '196.44.41.',
    'Kisoro': '196.44.42.',
    
    // Kenya
    'Nairobi': '197.248.1.',
    'Mombasa': '197.248.2.',
    'Kisumu': '197.248.3.',
    'Nakuru': '197.248.4.',
    'Eldoret': '197.248.5.',
    'Kenya': '197.248.10.',
    
    // Tanzania
    'Dar es Salaam': '196.216.1.',
    'Arusha': '196.216.2.',
    'Mwanza': '196.216.3.',
    'Dodoma': '196.216.4.',
    'Mbeya': '196.216.5.',
    'Tanzania': '196.216.10.',
    
    // Rwanda
    'Kigali': '197.243.1.',
    'Butare': '197.243.2.',
    'Gitarama': '197.243.3.',
    'Rwanda': '197.243.10.',
    
    // China - Major Cities
    'Beijing': '202.96.209.',
    'Shanghai': '202.96.199.',
    'Guangzhou': '202.96.128.',
    'Shenzhen': '202.96.134.',
    'Chengdu': '202.98.96.',
    'Hangzhou': '202.96.102.',
    'Wuhan': '202.103.24.',
    'Xi\'an': '202.100.18.',
    'Nanjing': '202.102.29.',
    'Tianjin': '202.99.96.',
    'Shenyang': '202.96.86.',
    'Harbin': '202.97.224.',
    'Chongqing': '202.98.224.',
    'Dalian': '202.96.75.',
    'Jinan': '202.102.154.',
    'Qingdao': '202.102.134.',
    'Kunming': '202.98.160.',
    'Taiyuan': '202.99.192.',
    'Changsha': '202.103.96.',
    'Zhengzhou': '202.102.224.',
    
    // India - Major Cities
    'Mumbai': '157.51.1.',
    'Delhi': '157.55.39.',
    'Bangalore': '203.192.203.',
    'Hyderabad': '203.199.71.',
    'Chennai': '203.192.228.',
    'Kolkata': '203.109.66.',
    'Pune': '203.88.138.',
    'Ahmedabad': '203.88.148.',
    
    // United States - Major Cities
    'New York': '204.79.197.',
    'Los Angeles': '173.252.74.',
    'Chicago': '208.77.188.',
    'Houston': '216.52.181.',
    'Phoenix': '198.175.124.',
    'Philadelphia': '198.102.218.',
    'San Antonio': '216.52.161.',
    'San Diego': '198.175.132.',
    'Dallas': '216.52.169.',
    'San Jose': '173.252.89.',
    
    // United Kingdom - Major Cities
    'London': '81.2.69.',
    'Manchester': '81.2.70.',
    'Birmingham': '81.2.71.',
    'Leeds': '81.2.72.',
    'Glasgow': '81.2.73.',
    'Liverpool': '81.2.74.',
    'Newcastle': '81.2.75.',
    'Sheffield': '81.2.76.',
    
    // Germany - Major Cities
    'Berlin': '91.198.174.',
    'Munich': '91.198.175.',
    'Hamburg': '91.198.176.',
    'Cologne': '91.198.177.',
    'Frankfurt': '91.198.178.',
    'Stuttgart': '91.198.179.',
    'Düsseldorf': '91.198.180.',
    'Dortmund': '91.198.181.',
    
    // Japan - Major Cities
    'Tokyo': '202.32.115.',
    'Osaka': '202.32.116.',
    'Kyoto': '202.32.117.',
    'Yokohama': '202.32.118.',
    'Nagoya': '202.32.119.',
    'Sapporo': '202.32.120.',
    'Fukuoka': '202.32.121.',
    'Kobe': '202.32.122.',
    
    // South Korea - Major Cities
    'Seoul': '175.223.23.',
    'Busan': '175.223.24.',
    'Incheon': '175.223.25.',
    'Daegu': '175.223.26.',
    'Daejeon': '175.223.27.',
    'Gwangju': '175.223.28.',
    'Ulsan': '175.223.29.',
    'Suwon': '175.223.30.',
    
    // Other Major Cities Worldwide
    'Dubai': '85.159.1.',
    'Lagos': '197.210.1.',
    'Cairo': '197.35.1.',
    'Cape Town': '196.35.1.',
    'Sydney': '203.217.5.',
    'Melbourne': '203.217.6.',
    'Toronto': '142.150.208.',
    'Vancouver': '142.150.209.',
    'Paris': '80.12.81.',
    'Madrid': '88.26.123.',
    'Rome': '93.63.216.',
    'Amsterdam': '145.53.251.',
    'Stockholm': '81.229.76.',
    'Moscow': '95.108.213.',
    'Istanbul': '88.255.149.',
    'Bangkok': '203.151.54.',
    'Singapore': '203.116.122.',
    'Kuala Lumpur': '203.106.79.',
    'Jakarta': '203.142.81.',
    'Manila': '203.177.11.',
    'Ho Chi Minh City': '203.162.4.',
    'Hanoi': '203.162.5.',
  };
  
  const baseIP = locationIPs[location] || '196.43.240.';
  const randomEnd = Math.floor(Math.random() * 254) + 1;
  return `${baseIP}${randomEnd}`;
};

// Default avatar seeds for different states
const DEFAULT_AVATAR_SEED = 'DefaultUser';
const GUEST_AVATAR_SEED = 'GuestUser';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { unreadCount } = useMessages();
  const { totalInvites } = useInvites();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showIPModal, setShowIPModal] = useState(false);

  const [slideAnim] = useState(new Animated.Value(-SCREEN_WIDTH));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const { theme: themeMode } = useThemeMode();
  const { t } = useTranslation();
  const { isLoggedIn, userInfo, initializeAuth } = useAuth();

  // User data with system generated values
  const [userData, setUserData] = useState({
    champsId: generateChampsId(),
    location: 'Detecting...', // Will be updated with real location
    quote: "", // Will be loaded from personal information screen
    ipAddress: generateIPAddress('Kampala'),
  });

  const [locationError, setLocationError] = useState<string | null>(null);
  const [showVipPrompt, setShowVipPrompt] = useState(false);
  const [showJerseyModal, setShowJerseyModal] = useState(false);

  // Jersey/VIP functionality
  const handleJerseyPress = () => {
    setShowVipPrompt(true);
  };

  const handleJerseyCustomization = () => {
    setShowVipPrompt(true);
  };

  const handleWallpaperCustomization = () => {
    setShowVipPrompt(true);
  };

  // Function to get current location with robust fallback system
  const getCurrentLocation = async () => {
    try {
      setLocationError(null);
      
      // Set default location immediately to avoid showing "Detecting..." for too long
      setUserData(prev => ({
        ...prev,
        location: 'Kampala', // Default to Kampala as fallback
        ipAddress: generateIPAddress('Kampala')
      }));

      // Progressive location detection with multiple fallbacks
      let detectedLocation = 'Kampala'; // Default fallback
      
      try {
        // Step 1: Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          // Step 2: Try high accuracy first
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            // Step 3: Reverse geocode to get address
            const reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
              const address = reverseGeocode[0];
              
              // For Uganda: prioritize district, for other countries: prioritize city
              if (address.country === 'Uganda' || address.country === 'UG') {
                detectedLocation = address.district || 
                                 address.subregion || 
                                 address.city || 
                                 address.region || 
                                 'Kampala';
              } else {
                detectedLocation = address.city || 
                                 address.district || 
                                 address.subregion || 
                                 address.region || 
                                 address.country || 
                                 getLocationFromCoordinates(location.coords.latitude, location.coords.longitude);
              }
              
              console.log('High accuracy location detected:', detectedLocation);
              console.log('Full address:', address);
            }
          } catch (highAccuracyError) {
            console.log('High accuracy failed, trying balanced accuracy...');
            
            // Step 4: Fallback to balanced accuracy
            try {
                             const location = await Location.getCurrentPositionAsync({
                 accuracy: Location.Accuracy.Balanced,
               });

              const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

                             if (reverseGeocode.length > 0) {
                 const address = reverseGeocode[0];
                 
                 // For Uganda: prioritize district, for other countries: prioritize city
                 if (address.country === 'Uganda' || address.country === 'UG') {
                   detectedLocation = address.district || 
                                    address.subregion || 
                                    address.city || 
                                    address.region || 
                                    'Kampala';
                 } else {
                   detectedLocation = address.city || 
                                    address.district || 
                                    address.subregion || 
                                    address.region || 
                                    address.country || 
                                    getLocationFromCoordinates(location.coords.latitude, location.coords.longitude);
                 }
                 
                 console.log('Balanced accuracy location detected:', detectedLocation);
               }
            } catch (balancedAccuracyError) {
              console.log('Balanced accuracy failed, trying low accuracy...');
              
              // Step 5: Fallback to low accuracy
              try {
                                 const location = await Location.getCurrentPositionAsync({
                   accuracy: Location.Accuracy.Low,
                 });

                detectedLocation = getLocationFromCoordinates(location.coords.latitude, location.coords.longitude);
                console.log('Low accuracy location detected:', detectedLocation);
              } catch (lowAccuracyError) {
                console.log('All GPS methods failed, using default location');
                // Keep default location (Kampala)
              }
            }
          }
        } else {
          console.log('Location permission denied, using default location');
          // Keep default location (Kampala)
        }
      } catch (permissionError) {
        console.log('Permission request failed, using default location');
        // Keep default location (Kampala)
      }

      // Always update with a valid location (never show error)
      setUserData(prev => ({
        ...prev,
        location: detectedLocation,
        ipAddress: generateIPAddress(detectedLocation)
      }));

      console.log('Final detected location:', detectedLocation);
      
    } catch (error) {
      console.error('Location detection error:', error);
      
      // Even if everything fails, set a default location
      setUserData(prev => ({
        ...prev,
        location: 'Kampala',
        ipAddress: generateIPAddress('Kampala')
      }));
    }
  };

  // Helper function to determine location from coordinates (Uganda focus)
  const getLocationFromCoordinates = (latitude: number, longitude: number) => {
    // Uganda coordinate bounds and major districts
    const ugandaDistricts = [
      // Central Region
      { name: 'Kampala', lat: 0.3476, lng: 32.5825, range: 0.1 },
      { name: 'Wakiso', lat: 0.4044, lng: 32.4597, range: 0.2 },
      { name: 'Mukono', lat: 0.3533, lng: 32.7553, range: 0.15 },
      { name: 'Entebbe', lat: 0.0564, lng: 32.4647, range: 0.1 },
      { name: 'Mpigi', lat: 0.2264, lng: 32.3114, range: 0.15 },
      
      // Eastern Region
      { name: 'Jinja', lat: 0.4312, lng: 33.2044, range: 0.1 },
      { name: 'Mbale', lat: 1.0827, lng: 34.1753, range: 0.15 },
      { name: 'Tororo', lat: 0.6928, lng: 34.1805, range: 0.1 },
      { name: 'Soroti', lat: 1.7147, lng: 33.6111, range: 0.15 },
      
      // Northern Region
      { name: 'Gulu', lat: 2.7797, lng: 32.2994, range: 0.2 },
      { name: 'Lira', lat: 2.2499, lng: 32.8998, range: 0.15 },
      { name: 'Arua', lat: 3.0197, lng: 30.9108, range: 0.15 },
      
      // Western Region
      { name: 'Mbarara', lat: -0.6103, lng: 30.6481, range: 0.15 },
      { name: 'Fort Portal', lat: 0.6714, lng: 30.2756, range: 0.1 },
      { name: 'Kasese', lat: 0.1833, lng: 30.0833, range: 0.1 },
      { name: 'Kabale', lat: -1.2481, lng: 29.9889, range: 0.1 },
    ];

    // Find closest district
    let closestDistrict = 'Kampala'; // Default
    let minDistance = Infinity;

    for (const district of ugandaDistricts) {
      const distance = Math.sqrt(
        Math.pow(latitude - district.lat, 2) + Math.pow(longitude - district.lng, 2)
      );
      
      if (distance < district.range && distance < minDistance) {
        minDistance = distance;
        closestDistrict = district.name;
      }
    }

    // If not in Uganda, check other countries (return city names)
    if (closestDistrict === 'Kampala' && minDistance > 0.5) {
      
      // China - Major Cities
      if (latitude > 18 && latitude < 54 && longitude > 73 && longitude < 135) {
        const chineseCities = [
          { name: 'Beijing', lat: 39.9042, lng: 116.4074, range: 0.5 },
          { name: 'Shanghai', lat: 31.2304, lng: 121.4737, range: 0.5 },
          { name: 'Guangzhou', lat: 23.1291, lng: 113.2644, range: 0.5 },
          { name: 'Shenzhen', lat: 22.5431, lng: 114.0579, range: 0.3 },
          { name: 'Chengdu', lat: 30.5728, lng: 104.0668, range: 0.5 },
          { name: 'Hangzhou', lat: 30.2741, lng: 120.1551, range: 0.3 },
          { name: 'Wuhan', lat: 30.5928, lng: 114.3055, range: 0.5 },
          { name: 'Xi\'an', lat: 34.3416, lng: 108.9398, range: 0.5 },
          { name: 'Nanjing', lat: 32.0603, lng: 118.7969, range: 0.3 },
          { name: 'Tianjin', lat: 39.3434, lng: 117.3616, range: 0.3 },
        ];
        
        for (const city of chineseCities) {
          const distance = Math.sqrt(
            Math.pow(latitude - city.lat, 2) + Math.pow(longitude - city.lng, 2)
          );
          if (distance < city.range) {
            return city.name;
          }
        }
        return 'Beijing'; // Default Chinese city
      }
      
      // Kenya - Cities
      if (latitude < 5 && latitude > -5 && longitude > 33 && longitude < 42) {
        if (latitude > -2 && latitude < 2 && longitude > 36 && longitude < 37) {
          return 'Nairobi';
        }
        if (latitude > -5 && latitude < -3 && longitude > 39 && longitude < 40) {
          return 'Mombasa';
        }
        return 'Nairobi'; // Default Kenyan city
      }
      
      // Tanzania - Cities
      if (latitude < 0 && latitude > -12 && longitude > 29 && longitude < 41) {
        if (latitude > -7 && latitude < -6 && longitude > 39 && longitude < 40) {
          return 'Dar es Salaam';
        }
        if (latitude > -4 && latitude < -2 && longitude > 36 && longitude < 38) {
          return 'Arusha';
        }
        return 'Dar es Salaam'; // Default Tanzanian city
      }
      
      // Rwanda - Cities
      if (latitude > -3 && latitude < -1 && longitude > 28 && longitude < 31) {
        return 'Kigali';
      }
      
      // India - Major Cities
      if (latitude > 6 && latitude < 37 && longitude > 68 && longitude < 98) {
        const indianCities = [
          { name: 'Mumbai', lat: 19.0760, lng: 72.8777, range: 0.5 },
          { name: 'Delhi', lat: 28.7041, lng: 77.1025, range: 0.5 },
          { name: 'Bangalore', lat: 12.9716, lng: 77.5946, range: 0.3 },
          { name: 'Chennai', lat: 13.0827, lng: 80.2707, range: 0.3 },
          { name: 'Kolkata', lat: 22.5726, lng: 88.3639, range: 0.3 },
        ];
        
        for (const city of indianCities) {
          const distance = Math.sqrt(
            Math.pow(latitude - city.lat, 2) + Math.pow(longitude - city.lng, 2)
          );
          if (distance < city.range) {
            return city.name;
          }
        }
        return 'Mumbai'; // Default Indian city
      }
      
      // United States - Major Cities
      if (latitude > 24 && latitude < 50 && longitude > -125 && longitude < -66) {
        const usCities = [
          { name: 'New York', lat: 40.7128, lng: -74.0060, range: 0.5 },
          { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, range: 0.5 },
          { name: 'Chicago', lat: 41.8781, lng: -87.6298, range: 0.3 },
          { name: 'Houston', lat: 29.7604, lng: -95.3698, range: 0.3 },
          { name: 'Phoenix', lat: 33.4484, lng: -112.0740, range: 0.3 },
        ];
        
        for (const city of usCities) {
          const distance = Math.sqrt(
            Math.pow(latitude - city.lat, 2) + Math.pow(longitude - city.lng, 2)
          );
          if (distance < city.range) {
            return city.name;
          }
        }
        return 'New York'; // Default US city
      }
      
      // United Kingdom - Cities
      if (latitude > 49 && latitude < 61 && longitude > -8 && longitude < 2) {
        if (latitude > 51 && latitude < 52 && longitude > -1 && longitude < 1) {
          return 'London';
        }
        return 'London'; // Default UK city
      }
      
      // Default to Kampala if location unclear
      return 'Kampala';
    }

    return closestDistrict;
  };

  // State to store saved profile picture
  const [savedProfilePicture, setSavedProfilePicture] = useState<string | null>(null);

  // Load saved profile data
  const loadProfileData = () => {
    try {
      if (global.savedProfileData && global.savedProfileData.personalInfo) {
        const personalInfo = global.savedProfileData.personalInfo;
        setUserData(prev => ({
          ...prev,
          quote: personalInfo.quote || "",
          // Could also load other info like location if saved
        }));
        
        // Load saved profile picture
        if (personalInfo.profilePicture) {
          setSavedProfilePicture(personalInfo.profilePicture);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  useEffect(() => {
    initializeAuth();
    // Get real-time location on component mount
    getCurrentLocation();
    // Load profile data on mount
    loadProfileData();
  }, []);

  // Reload profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const openSideMenu = () => {
    setShowSideMenu(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeSideMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSideMenu(false);
    });
  };

  const menuGroups = [
    {
      items: [
        { icon: Wallet, label: 'My Wallet', value: 'USh 0.00', action: () => { closeSideMenu(); router.push('/MyWallet'); } },
        { icon: Gift, label: 'Coins', value: '0', action: () => { closeSideMenu(); router.push('/Coins'); } },
        { icon: Clock, label: 'Vouchers', value: '0', action: () => { closeSideMenu(); router.push('/vouchers'); } },
      ]
    },
    {
      items: [
        { icon: Award, label: 'My Pendants', action: () => { closeSideMenu(); /* Add navigation */ } },
        { icon: ClipboardList, label: 'Records', action: () => { closeSideMenu(); router.push('/PurchaseRecords'); } },
        { icon: ShoppingBag, label: 'Store', action: () => { closeSideMenu(); router.push('/store'); } },
      ]
    },
    {
      items: [
        { icon: TrendingUp, label: 'Prediction', action: () => { closeSideMenu(); router.push('/predictions'); } },
        { icon: Users, label: 'Community', action: () => { closeSideMenu(); router.push('/(tabs)/discover?tab=community'); } },
        { icon: Users, label: 'Invites', action: () => { closeSideMenu(); router.push('/my-invites'); } },
      ]
    },
    {
      items: [
        { icon: MapPin, label: 'Footmark', action: () => { closeSideMenu(); router.push('/footmark'); } },
      ]
    },
    {
      items: [
        { icon: User, label: 'My Focus', action: () => { closeSideMenu(); router.push('/my-focus'); } },
      ]
    }
  ];

  const horizontalMenuItems = [
    { icon: ScanLine, label: 'Scan', action: () => { closeSideMenu(); router.push('/scan'); } },
    { icon: Headphones, label: 'Help Center', action: () => { closeSideMenu(); router.push('/help-center'); } },
    { icon: Settings, label: 'Settings', action: () => { closeSideMenu(); router.push('/profile-settings'); } },
  ];

  const stats = [
    { label: 'Following', value: '0' },
    { label: 'Fans', value: '0' },
    { label: 'Messages', value: unreadCount.toString() },
  ];

  const wallet = [
    { icon: Wallet, label: 'My Wallet', value: '0.00', color: '#FF4757', showPlus: true, action: () => router.push('/MyWallet') },
    { icon: Gift, label: 'Coins', value: '0', color: '#FFA502', action: () => router.push('/Coins') },
    { icon: Clock, label: 'Vouchers', value: '0', color: '#2ED573', action: () => router.push('/vouchers') },
  ];

  const menuItems = [
    { icon: ClipboardList, label: 'Records', action: () => router.push('/PurchaseRecords') },
    { icon: ShoppingBag, label: 'Store', action: () => router.push('/store') },
    { icon: TrendingUp, label: 'Prediction', action: () => router.push('/predictions') },
    { icon: MapPin, label: 'Footmark', action: () => router.push('/footmark') },
    { icon: Settings, label: 'Notification Settings', action: () => router.push('/notification-settings') },
    { icon: Headphones, label: 'Help Center', badge: 1, action: () => router.push('/help-center') },
  ];

  const renderThemeIcon = () => {
    if (themeMode === 'dark') {
      return <MoonStar size={20} color="#FFFFFF" />;
    } else if (themeMode === 'light') {
      return <Sun size={20} color="#FFFFFF" />;
    }
    // For system mode, use SunMoon to represent both
    return <SunMoon size={20} color="#FFFFFF" />;
  };

  const handleMenuItemPress = (item: any) => {
    if (item.action) {
      item.action();
    }
  };

  const handleWalletItemPress = (item: any) => {
    if (item.action) {
      item.action();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={true}
        scrollEventThrottle={16}
        decelerationRate="normal"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Profile Background */}
        <View style={[styles.profileBackground, { 
          backgroundColor: '#4A4A4A',
          marginTop: -16,
          paddingTop: 16,
        }]}>
          {/* Top Icons inside red background */}
          <View style={styles.topIcons}>
            {/* Hamburger Menu Icon */}
            <TouchableOpacity 
              style={styles.hamburgerButton}
              onPress={openSideMenu}
              activeOpacity={0.7}
            >
              <Menu size={20} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
            
            <View style={styles.topRightIcons}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => router.push('/scan')}
              >
                <ScanLine size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setShowThemeSelector(true)}
              >
                {renderThemeIcon()}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setShowShareModal(true)}
              >
                <Share size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {isLoggedIn ? (
              <>
                {/* Profile Picture and User Info Row */}
                <View style={styles.profileRow}>
                  <View style={styles.leftColumn}>
                    <View style={styles.avatarContainer}>
                      <Image
                        source={{ 
                          uri: getCurrentProfilePicture(userInfo)
                        }}
                        style={styles.avatarImage}
                        fadeDuration={0}
                        resizeMode="cover"
                        defaultSource={require('@/assets/images/icon.png')}
                      />
                    </View>
                    
                  </View>

                  <View style={styles.userInfoContainer}>
                    <View style={styles.usernameWithJerseyContainer}>
                      <Text style={styles.usernameText}>
                        {getCurrentUsername(userInfo)}
                      </Text>
                      
                      {/* Jersey Icon next to username */}
                      <TouchableOpacity
                        style={styles.profileJerseyContainer}
                        onPress={handleJerseyPress}
                        activeOpacity={0.7}
                      >
                        <View style={styles.profileJerseyIcon}>
                          <View style={styles.profileJerseyBody}>
                            <Text style={styles.profileJerseyNumber}>8</Text>
                          </View>
                          <View style={styles.profileJerseySleeves}>
                            <View style={styles.profileJerseySleeve} />
                            <View style={styles.profileJerseySleeve} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Champs ID with QR Code */}
                    <View style={styles.champsIdContainer}>
                      <Text style={styles.champsIdLabel}>Champs ID:</Text>
                      <Text style={styles.champsIdValue}>{userData.champsId}</Text>
                      <TouchableOpacity 
                        style={styles.qrCodeButton}
                        onPress={() => router.push('/my-qr-code')}
                      >
                        <QRCode
                          value={userData.champsId}
                          size={16}
                          color="rgba(255,255,255,0.4)"
                          backgroundColor="transparent"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* IP Address with Alert */}
                    <View style={styles.ipAddressContainer}>
                      <Text style={styles.ipAddressLabel}>IP Address:</Text>
                      <TouchableOpacity onPress={getCurrentLocation} activeOpacity={0.7}>
                        <Text style={styles.ipAddressValue}>{userData.location}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.alertButton}
                        onPress={() => setShowIPModal(true)}
                      >
                        <AlertTriangle size={12} color="rgba(255,215,0,0.6)" />
                      </TouchableOpacity>
                    </View>

                    {/* Joined Days Ago under IP Address */}
                    <View style={styles.joinedContainer}>
                      <Text style={styles.joinedText}>
                        Joined <Text style={styles.joinedDaysCount}>0</Text> days ago
                      </Text>
                    </View>

                    {/* My Pendants under Joined */}
                    <TouchableOpacity 
                      style={styles.pendantsContainerSmall}
                      onPress={() => {/* Add pendants navigation */}}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pendantsTextSmall}>{t('My Pendants')} ⚡</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quote - Horizontal from left side */}
                <View style={styles.quoteContainer}>
                  <Text style={styles.quoteText}>{userData.quote}</Text>
                </View>

                {/* Stats and Edit Buttons Section */}
                <View style={styles.statsAndEditSection}>
                  {/* Stats Section - Small and Dull Grey */}
                  <View style={styles.statsRowCompact}>
                    {stats.map((stat, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.statItemCompact}
                        onPress={() => {
                          if (stat.label === 'Messages') {
                            router.push('/user-messages');
                          } else if (stat.label === 'Invites') {
                            router.push('/my-invites');
                          } else if (stat.label === 'Fans') {
                            router.push('/my-fans');
                          } else if (stat.label === 'Following') {
                            router.push('/my-following');
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.statValueCompact}>{stat.value}</Text>
                        <Text style={styles.statLabelCompact}>{t(stat.label)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Edit Profile and Settings buttons - Right Edge */}
                  <View style={styles.editProfileRightEdge}>
                    <TouchableOpacity 
                      style={styles.editProfileButtonRight}
                      onPress={() => router.push('/profile-page')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editProfileTextRight}>{t('Edit Profile')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.settingsIconButtonRight}
                      onPress={() => router.push('/profile-settings')}
                      activeOpacity={0.7}
                    >
                      <Cog size={17} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.avatarContainer, styles.defaultAvatar]}>
                  <Image
                    source={{ 
                      uri: getCurrentProfilePicture(null)
                    }}
                    style={styles.avatarImage}
                    fadeDuration={0}
                    resizeMode="cover"
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.loginButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={() => router.push('/login-register')}
                  activeOpacity={0.7}
                >
                  <LogIn size={16} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>{t('Login/Register')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Edit Profile moved to stats section */}
        </View>

        {/* Content Container */}
        <View style={[styles.contentContainer, { backgroundColor: theme.colors.background }]}>
          {/* Stats moved to red background section above */}

          {/* VIP Section */}
          <TouchableOpacity 
            style={[styles.vipCard, { 
              backgroundColor: theme.colors.text === '#000000' ? '#F5F5F5' : theme.colors.backgroundSecondary,
              shadowColor: theme.colors.text,
            }]}
            onPress={() => router.push('/activate-vip')}
            activeOpacity={0.8}
          >
            <View style={styles.vipContent}>
              <Crown size={28} color="#FFD700" />
              <View style={styles.vipTextContainer}>
                <Text style={[styles.vipTitle, { 
                  color: theme.colors.text 
                }]}>{t('Activate VIP')}</Text>
                <Text 
                  style={[styles.vipSubtitle, { color: theme.colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t('Unblock More benefits')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Check-in Section */}
          <TouchableOpacity 
            style={[styles.checkinCard, { 
              backgroundColor: theme.colors.text === '#000000' ? '#F5F5F5' : theme.colors.backgroundSecondary,
              shadowColor: theme.colors.text,
            }]}
            onPress={() => router.push('/check-in')}
            activeOpacity={0.8}
          >
            <View style={styles.checkinContent}>
              <Gift size={26} color="#DC2626" />
              <View style={styles.checkinTextContainer}>
                <Text style={[styles.checkinTitle, { color: theme.colors.text }]}>{t('Check-in')}</Text>
                <Text style={[styles.checkinSubtitle, { color: theme.colors.textSecondary }]}>
                  {t('Points Rewarded today')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* More Features Button */}
          <TouchableOpacity 
            style={[styles.moreFeatureCard, { 
              backgroundColor: theme.colors.text === '#000000' ? '#F5F5F5' : theme.colors.backgroundSecondary,
              shadowColor: theme.colors.text,
              alignItems: 'flex-start',
            }]}
            onPress={() => router.push('/more-features')}
            activeOpacity={0.7}
          >
            <View style={styles.moreFeatureContent}>
              <View style={styles.moreAppsIcon}>
                <View style={[styles.appSquare, { backgroundColor: '#DC2626' }]} />
                <View style={[styles.appSquare, { backgroundColor: '#DC2626' }]} />
                <View style={[styles.appSquare, { backgroundColor: '#DC2626' }]} />
                <View style={styles.plusSquare}>
                  <Plus size={10} color="#DC2626" strokeWidth={3} />
                </View>
              </View>
              <Text style={[styles.moreFeatureText, { color: theme.colors.text }]}>{t('More Features')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Side Menu Modal */}
      <Modal
        visible={showSideMenu}
        transparent={true}
        animationType="none"
        onRequestClose={closeSideMenu}
      >
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <Animated.View 
            style={[
              styles.overlay, 
              { opacity: overlayOpacity }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouchable}
              onPress={closeSideMenu}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Side Menu */}
          <Animated.View 
            style={[
              styles.sideMenu, 
              { 
                backgroundColor: theme.colors.background,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <SafeAreaView style={styles.sideMenuContent}>
              <ScrollView style={styles.sideMenuScroll}>
                {/* Grouped Menu Items */}
                <View style={styles.verticalMenuSection}>
                  {menuGroups.map((group, groupIndex) => (
                    <View key={groupIndex} style={[styles.menuGroup, { 
                      backgroundColor: theme.colors.backgroundSecondary,
                      shadowColor: theme.colors.text,
                    }]}>
                      {group.items.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.sideMenuItem, 
                            { borderBottomColor: theme.colors.border },
                            index === group.items.length - 1 && styles.lastMenuItem
                          ]}
                          onPress={item.action}
                          activeOpacity={0.7}
                        >
                          <item.icon size={20} color={theme.colors.text} />
                          <View style={styles.sideMenuItemContent}>
                            <Text style={[styles.sideMenuItemText, { color: theme.colors.text }]}>
                              {t(item.label)}
                            </Text>
                            {'value' in item && item.value && (
                              <Text style={[styles.sideMenuItemValue, { color: theme.colors.primary }]}>
                                {item.value}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>

                                </ScrollView>
                
                {/* Bottom Action Items - Fixed at bottom */}
                <View style={styles.bottomActionsContainer}>
                  {horizontalMenuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.bottomActionItem}
                      onPress={item.action}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.bottomActionIcon, 
                        { 
                          backgroundColor: theme.colors.text === '#FFFFFF' ? '#2D3748' : '#E5E7EB' 
                        }
                      ]}>
                        <item.icon 
                          size={18} 
                          color={theme.colors.text === '#FFFFFF' ? '#FFFFFF' : theme.colors.text} 
                        />
                      </View>
                      <Text style={[styles.bottomActionText, { color: theme.colors.textSecondary }]}>
                        {t(item.label)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalContainer}>
          <TouchableOpacity 
            style={styles.shareOverlay}
            onPress={() => setShowShareModal(false)}
            activeOpacity={1}
          />
          <View style={[styles.shareModal, { backgroundColor: theme.colors.background }]}>
            <View style={styles.shareHeader}>
              <Text style={[styles.shareTitle, { color: theme.colors.text }]}>Share Profile</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shareOptions}
              style={styles.shareScrollView}
            >
              {/* WhatsApp */}
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={[styles.shareLabel, { color: theme.colors.text }]}>WhatsApp</Text>
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIcon, { backgroundColor: '#E4405F' }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" 
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={[styles.shareLabel, { color: theme.colors.text }]}>Instagram</Text>
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIcon, { backgroundColor: '#1877F2' }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M23.9981 11.9991C23.9981 5.37216 18.626 0 11.9991 0C5.37216 0 0 5.37216 0 11.9991C0 17.9882 4.38789 22.9522 10.1242 23.8524V15.4676H7.07758V11.9991H10.1242V9.35553C10.1242 6.34826 11.9156 4.68714 14.6564 4.68714C15.9692 4.68714 17.3424 4.92149 17.3424 4.92149V7.87439H15.8294C14.3388 7.87439 13.8739 8.79933 13.8739 9.74824V11.9991H17.2018L16.6698 15.4676H13.8739V23.8524C19.6103 22.9522 23.9981 17.9882 23.9981 11.9991Z" 
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={[styles.shareLabel, { color: theme.colors.text }]}>Facebook</Text>
              </TouchableOpacity>

              {/* Pinterest */}
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIcon, { backgroundColor: '#BD081C' }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M12 0C5.373 0 0 5.372 0 12.017c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12.001 24.001c6.624 0 11.99-5.373 11.99-12.017C24.001 5.372 18.626.001 12.001.001z" 
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={[styles.shareLabel, { color: theme.colors.text }]}>Pinterest</Text>
              </TouchableOpacity>

              {/* Twitter/X */}
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIcon, { backgroundColor: '#000000' }]}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" 
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>
                <Text style={[styles.shareLabel, { color: theme.colors.text }]}>X</Text>
              </TouchableOpacity>

              {/* Copy Link */}
              <TouchableOpacity style={styles.shareOption}>
                <View style={[styles.shareIcon, { backgroundColor: theme.colors.textSecondary }]}>
                  <ClipboardList size={32} color="#FFFFFF" />
                </View>
                <Text style={[styles.shareLabel, { color: theme.colors.text }]}>Copy Link</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Separator Line */}
            <View style={[styles.shareSeparator, { backgroundColor: theme.colors.border }]} />

            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowShareModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* IP Address Modal */}
      <Modal
        visible={showIPModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIPModal(false)}
      >
        <View style={styles.centeredModalContainer}>
          <TouchableOpacity 
            style={styles.centeredOverlay}
            onPress={() => setShowIPModal(false)}
            activeOpacity={1}
          />
          <View style={[styles.ipModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.ipModalContent}>
              <AlertTriangle size={40} color="#FFD700" />
              <Text style={[styles.ipModalTitle, { color: theme.colors.text }]}>Notice</Text>
              <Text style={[styles.ipModalText, { color: theme.colors.textSecondary }]}>
                IP address is shown due to Cyber Security and authenticity requirements.
              </Text>
              <TouchableOpacity 
                style={[styles.ipModalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowIPModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.ipModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* VIP Prompt Modal */}
      <Modal
        visible={showVipPrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVipPrompt(false)}
      >
        <View style={styles.vipPromptOverlay}>
          <View style={[styles.vipPromptModal, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {/* VIP Icon */}
            <View style={styles.vipPromptIcon}>
              <Crown size={40} color="#FFD700" />
            </View>
            
            {/* Title */}
            <Text style={[styles.vipPromptTitle, { color: theme.colors.text }]}>VIP Feature</Text>
            
            {/* Description */}
            <Text style={[styles.vipPromptDescription, { color: theme.colors.textSecondary }]}>
              Jersey customization and wallpapers are VIP exclusive features. Would you like to upgrade to VIP to unlock these features?
            </Text>
            
            {/* Button separator line */}
            <View style={styles.vipPromptButtonSeparator} />
            
            {/* Buttons */}
            <View style={styles.vipPromptButtons}>
              <TouchableOpacity
                style={styles.vipPromptNotNowButton}
                onPress={() => setShowVipPrompt(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.vipPromptNotNowText}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.vipPromptUpgradeButton}
                onPress={() => {
                  setShowVipPrompt(false);
                  router.push('/activate-vip');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.vipPromptUpgradeText}>Upgrade to VIP</Text>
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
    margin: 0,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  topRightIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
    minHeight: 80,
  },
  profileBackground: {
    paddingTop: 0,
    paddingBottom: 55,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#4A4A4A',
    marginTop: 0,
    marginHorizontal: 0,
  },
  profileSection: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  usernameText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'left',
  },
  pendantsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pendantsText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  contentContainer: {
    marginTop: -35,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 60,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
  },
  hamburgerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 0,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'flex-start',
    minHeight: 80,
  },
  loginText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  profilePageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePageText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  navigationArrow: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  pendantButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    position: 'absolute',
    right: 0,
    top: 16,
  },
  pendantText: {
    fontSize: 10.5,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  overlayTouchable: {
    flex: 1,
  },
  sideMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopRightRadius: 20,
  },
  sideMenuContent: {
    flex: 1,
    paddingTop: 10,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sideMenuTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  sideMenuScroll: {
    flex: 1,
  },
  verticalMenuSection: {
    paddingTop: 8,
  },
  menuGroup: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  sideMenuItemText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  horizontalMenuSection: {
    marginTop: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  horizontalMenuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 20,
    minHeight: 60,
    justifyContent: 'center',
  },
  horizontalMenuText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 12,
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  bottomActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomActionText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  vipCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
    elevation: 6,
  },
  vipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  vipRight: {
    alignItems: 'flex-end',
  },
  vipSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
    flexWrap: 'nowrap',
  },
  vipButton: {
    color: '#FFD700',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
    textAlign: 'right',
  },
  checkinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 15,
    shadowOffset: {
      width: 0,
      height: 2.5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4.25,
    elevation: 5,
  },
  checkinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinTitle: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
  },
  checkinRight: {
    alignItems: 'flex-end',
  },
  checkinSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
    marginLeft: 12,
  },
  checkinButton: {
    color: '#FF6B81',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
    textAlign: 'right',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 0,
    marginBottom: 20,
    paddingBottom: 0,
  },
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomButtonValue: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  bottomButtonLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  moreFeatureCard: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    marginTop: 0,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  moreFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  moreFeatureText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  moreAppsIcon: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginBottom: 2,
  },
  plusSquare: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  sideMenuItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideMenuItemValue: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  walletContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  walletItem: {
    alignItems: 'center',
    flex: 1,
  },
  walletIconContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  menuItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  menuLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 32,
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: '30%',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  loggedOutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-start',
    marginTop: 16,
  },
  loggedOutProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loggedOutInfo: {
    marginLeft: 8,
  },
  defaultAvatar: {
    opacity: 0.6,
  },
  loginSignupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 0,
  },
  loginSignupText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  guestText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
    marginTop: 2,
  },
  editProfileContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editProfileText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  settingsIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shareModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shareModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 20,
    minHeight: 350,
  },
  shareHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  shareTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  shareScrollView: {
    maxHeight: 120,
  },
  shareOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  shareOption: {
    alignItems: 'center',
    gap: 10,
    minWidth: 80,
  },
  shareIcon: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  shareSeparator: {
    height: 1,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // New styles for profile row and user info
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
    minHeight: 100,
  },
  champsIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  champsIdLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(130, 130, 130, 0.7)',
    marginRight: 3,
  },
  champsIdValue: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(140, 140, 140, 0.8)',
    marginRight: 6,
  },
  qrCodeButton: {
    padding: 2,
  },
  ipAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ipAddressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(130, 130, 130, 0.7)',
    marginRight: 3,
  },
  ipAddressValue: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(140, 140, 140, 0.8)',
    marginRight: 4,
  },
  alertButton: {
    padding: 2,
  },
  quoteText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#B0B0B0',
    fontStyle: 'italic',
    textAlign: 'left',
    paddingHorizontal: 0,
    marginBottom: 8,
    marginLeft: 4,
  },
  quoteContainer: {
    alignSelf: 'flex-start',
    width: '100%',
    marginTop: 6,
    paddingRight: 20,
    paddingLeft: 5,
  },
  leftColumn: {
    alignItems: 'flex-start',
    width: 100,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 15,
    width: '100%',
  },
  statsRowCompact: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 0,
    marginTop: 0,
    gap: 8,
    marginLeft: 2,
    flex: 1,
    maxWidth: '30%',
  },
  statItemCompact: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  statValueCompact: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: 'rgba(180, 180, 180, 0.9)',
    marginBottom: 2,
  },
  statLabelCompact: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: 'rgba(160, 160, 160, 0.8)',
    textAlign: 'center',
  },
  editProfileCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 5,
    gap: 8,
    position: 'absolute',
    right: 0,
  },
  editProfileButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
  },
  editProfileTextCompact: {
    fontSize: 8,
    fontFamily: 'Inter-Medium',
    color: 'rgba(120, 120, 120, 0.8)',
  },
  settingsIconButtonCompact: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
  },
  pendantsContainerSmall: {
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendantsTextSmall: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: 'rgba(130, 130, 130, 0.7)',
  },
  joinedContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  joinedText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(130, 130, 130, 0.7)',
  },
  joinedDaysCount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  vipTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  checkinTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  // IP Modal styles
  ipModal: {
    marginHorizontal: 50,
    borderRadius: 16,
    padding: 0,
    alignSelf: 'center',
    maxWidth: 280,
    width: '100%',
  },
  ipModalContent: {
    padding: 16,
    alignItems: 'center',
  },
  ipModalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  ipModalText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  ipModalButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  ipModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  moreFeaturesModal: {
    marginHorizontal: 30,
    borderRadius: 20,
    padding: 0,
    alignSelf: 'center',
    maxWidth: 320,
    width: '100%',
  },
  moreFeaturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  moreFeaturesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  closeModalButton: {
    padding: 4,
  },
  quickFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  quickFeatureItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quickFeatureText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 6,
  },
  // New styles for comprehensive redesign
  statsAndEditSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: -19,
    paddingVertical: 8,
    width: '100%',
    position: 'relative',
  },
  editProfileRightEdge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
    paddingRight: 5,
  },
  editProfileButtonRight: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editProfileTextRight: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  settingsIconButtonRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Jersey and Username Container Styles
  usernameWithJerseyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileJerseyContainer: {
    marginLeft: 8,
  },
  profileJerseyIcon: {
    position: 'relative',
    alignItems: 'center',
  },
  profileJerseyBody: {
    backgroundColor: '#6B7280',
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  profileJerseyNumber: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileJerseySleeves: {
    flexDirection: 'row',
    position: 'absolute',
    top: 1,
    left: -5,
    right: -5,
    justifyContent: 'space-between',
  },
  profileJerseySleeve: {
    backgroundColor: '#6B7280',
    width: 10,
    height: 12,
    borderRadius: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  // VIP Prompt Modal Styles
  vipPromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipPromptModal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  vipPromptIcon: {
    marginTop: 32,
    marginBottom: 20,
  },
  vipPromptTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  vipPromptDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  vipPromptButtonSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 0,
  },
  vipPromptButtons: {
    flexDirection: 'row',
    width: '100%',
    height: 44,
  },
  vipPromptNotNowButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF',
  },
  vipPromptNotNowText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#F9FAFB',
  },
  vipPromptUpgradeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  vipPromptUpgradeText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});