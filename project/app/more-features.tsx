import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp,
  Smartphone,
  UserPlus,
  Shield,
  Mail,
  Settings,
  DollarSign,
  Target,
  MapPin,
  Bell,
  Headphones,
  Zap,
  ShoppingBag,
  ClipboardList,
  Plus,
  X,
  Trophy,
  Coins,
  TrendingUp,
  Banknote
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

type FeatureItem = {
  id: string;
  icon: any;
  label: string;
  route: string;
  color?: string;
};

export default function MoreFeaturesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [isOtherFeaturesExpanded, setIsOtherFeaturesExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // All available features - master list
  const allFeatures: FeatureItem[] = [
    { 
      id: 'modify-phone', 
      icon: Smartphone, 
      label: 'Modify Phone Number', 
      route: '/modify-phone',
      color: 'transparent'
    },
    { 
      id: 'invite-friends', 
      icon: UserPlus, 
      label: 'Invite Friends', 
      route: '/invite-friends',
      color: 'transparent'
    },
    { 
      id: 'user-screen', 
      icon: Shield, 
      label: 'User Screen', 
      route: '/blocked-users',
      color: 'transparent'
    },
    { 
      id: 'feedback', 
      icon: Mail, 
      label: 'Complaints & Feedback', 
      route: '/help-center/complaints-and-feedback',
      color: 'transparent'
    },
    { 
      id: 'match-settings', 
      icon: Settings, 
      label: 'Match Settings', 
      route: '/match-settings',
      color: 'transparent'
    },
    { 
      id: 'recharge-issues', 
      icon: Banknote, 
      label: 'Recharge Issues', 
      route: '/recharge-issues',
      color: 'transparent'
    },
    { 
      id: 'prediction-number', 
      icon: TrendingUp, 
      label: 'Prediction Number', 
      route: '/prediction-numbers',
      color: 'transparent'
    },
    { 
      id: 'footprints', 
      icon: MapPin, 
      label: 'Footprints', 
      route: '/footmark',
      color: 'transparent'
    },
    { 
      id: 'notification-settings', 
      icon: Bell, 
      label: 'Notification Settings', 
      route: '/notification-settings',
      color: 'transparent'
    },
    { 
      id: 'account-treasure', 
      icon: Headphones, 
      label: 'Account Treasure Box', 
      route: '/help-center',
      color: 'transparent'
    },
    { 
      id: 'thunder-speed', 
      icon: Trophy, 
      label: 'Champs Number', 
      route: '/prediction-verification',
      color: 'transparent'
    },
    { 
      id: 'store', 
      icon: ShoppingBag, 
      label: 'Store', 
      route: '/store',
      color: 'transparent'
    },
    { 
      id: 'records', 
      icon: ClipboardList, 
      label: 'Records', 
      route: '/PurchaseRecords',
      color: 'transparent'
    }
  ];

  // State to track which features are in each section
  const [commonFeatureIds, setCommonFeatureIds] = useState<string[]>([
    'modify-phone',
    'invite-friends', 
    'user-screen'
  ]);
  
  const [otherFeatureIds, setOtherFeatureIds] = useState<string[]>([
    'feedback',
    'match-settings',
    'recharge-issues',
    'prediction-number',
    'footprints',
    'notification-settings',
    'account-treasure',
    'thunder-speed',
    'store',
    'records'
  ]);

  // Get features based on IDs
  const getFeaturesByIds = (ids: string[]): FeatureItem[] => {
    return ids.map(id => allFeatures.find(feature => feature.id === id)!).filter(Boolean);
  };

  const commonFeatures = getFeaturesByIds(commonFeatureIds);
  const otherFeatures = getFeaturesByIds(otherFeatureIds);

  const handleEditPress = () => {
    if (isEditMode) {
      // Finish editing
      setIsEditMode(false);
      setIsOtherFeaturesExpanded(false);
    } else {
      // Start editing
      setIsEditMode(true);
      setIsOtherFeaturesExpanded(true);
    }
  };

  const moveFeatureToOppositeSection = (featureId: string) => {
    const isInCommon = commonFeatureIds.includes(featureId);
    
    if (isInCommon) {
      // Moving from Common to Other Features
      setCommonFeatureIds(prev => prev.filter(id => id !== featureId));
      setOtherFeatureIds(prev => [...prev, featureId]);
    } else {
      // Moving from Other Features to Common Features
      // Check if Common Features would exceed maximum of 6 buttons
      if (commonFeatureIds.length >= 6) {
        Alert.alert(
          'Maximum Reached',
          'You have added maximum of 6 buttons already.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if Other Features would have at least 7 buttons after removal
      if (otherFeatureIds.length <= 7) {
        Alert.alert(
          'Minimum Required',
          'Other Features section must have at least 7 buttons.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setOtherFeatureIds(prev => prev.filter(id => id !== featureId));
      setCommonFeatureIds(prev => [...prev, featureId]);
    }
  };

  const handleEditButtonPress = (featureId: string) => {
    moveFeatureToOppositeSection(featureId);
  };

  const handleFeaturePress = (feature: FeatureItem) => {
    if (isEditMode) {
      // In edit mode, pressing the button also moves it to opposite section
      moveFeatureToOppositeSection(feature.id);
      return;
    }

    // Navigate to the feature
    try {
      router.push(feature.route);
    } catch (error) {
      console.log(`Navigating to: ${feature.route}`);
      Alert.alert('Feature', `Opening ${feature.label}...`);
    }
  };

  const renderFeatureGrid = (features: FeatureItem[], isCommonFeature: boolean) => (
    <View style={styles.featuresGrid}>
      {features.map((feature) => (
        <TouchableOpacity
          key={feature.id}
          style={[
            styles.featureItem,
            { backgroundColor: theme.colors.backgroundSecondary },
            isEditMode && styles.featureItemEdit
          ]}
          onPress={() => handleFeaturePress(feature)}
          activeOpacity={isEditMode ? 0.5 : 0.7}
        >
          <View style={[styles.featureIconContainer, { backgroundColor: feature.color || '#666' }]}>
            <feature.icon 
              size={20} 
              color="#E53935" 
            />
          </View>
          <Text 
            style={[styles.featureLabel, { color: theme.colors.text }]}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {feature.label}
          </Text>
          {isEditMode && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditButtonPress(feature.id)}
              activeOpacity={0.7}
            >
              {isCommonFeature ? (
                <X size={12} color="#888888" />
              ) : (
                <Plus size={12} color="#888888" />
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>More Features</Text>
        <TouchableOpacity 
          style={styles.headerEditButton}
          onPress={handleEditPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.editText, 
            { color: isEditMode ? '#EF5350' : theme.colors.text }
          ]}>
            {isEditMode ? 'Finish' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Common Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Common Features
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Click to enter function
            </Text>
          </View>
          {renderFeatureGrid(commonFeatures, true)}
        </View>

        {/* Other Features Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => setIsOtherFeaturesExpanded(!isOtherFeaturesExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Other Features
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                {isOtherFeaturesExpanded ? 'Collapse' : 'Expand'}
              </Text>
            </View>
            {isOtherFeaturesExpanded ? (
              <ChevronUp size={24} color={theme.colors.textSecondary} />
            ) : (
              <ChevronDown size={24} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
          
          {isOtherFeaturesExpanded && renderFeatureGrid(otherFeatures, false)}
        </View>
      </ScrollView>
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
  headerEditButton: {
    padding: 4,
  },
  editText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  featureItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
    position: 'relative',
  },
  featureItemEdit: {
    opacity: 0.8,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 13,
    maxWidth: '100%',
    paddingHorizontal: 1,
    flexShrink: 1,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});