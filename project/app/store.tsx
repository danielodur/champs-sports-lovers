import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  TextInput, 
  Platform,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Bell, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Shield, 
  Settings,
  Gift,
  Star,
  Crown,
  Zap,
  Package,
  Heart,
  Trophy,
  Headphones
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { formatPhoneNumber, formatPhoneNumberWithoutCountryCode, validateUgandanPhoneNumber } from '@/utils/phoneFormatter';

interface NotificationSettings {
  // Order Management
  newOrderNotifications: boolean;
  orderStatusUpdates: boolean;
  deliveryUpdates: boolean;
  
  // Marketing Communications
  promotionalOffers: boolean;
  storeNewsUpdates: boolean;
  
  // Account & System
  paymentConfirmations: boolean;
  accountSecurityAlerts: boolean;
  systemMaintenanceUpdates: boolean;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  quantity: number;
  icon: any;
  color: string;
  category: 'prediction' | 'gift' | 'premium';
  description: string;
  popular?: boolean;
}

export default function StoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('prediction');
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newOrderNotifications: true,
    orderStatusUpdates: true,
    deliveryUpdates: true,
    promotionalOffers: false,
    storeNewsUpdates: true,
    paymentConfirmations: true,
    accountSecurityAlerts: true,
    systemMaintenanceUpdates: false,
  });

  // Store items with UGX pricing
  const storeItems: StoreItem[] = [
    {
      id: '1',
      name: 'SportWee Premium Card',
      price: 168000,
      originalPrice: 200000,
      discount: 16,
      quantity: 10,
      icon: Crown,
      color: '#FF6B6B',
      category: 'premium',
      description: 'Premium prediction access',
      popular: true
    },
    {
      id: '2',
      name: 'Prediction Bundle',
      price: 98000,
      originalPrice: 120000,
      discount: 18,
      quantity: 5,
      icon: Zap,
      color: '#4ECDC4',
      category: 'prediction',
      description: 'Advanced predictions'
    },
    {
      id: '3',
      name: 'VIP Access Card',
      price: 58000,
      originalPrice: 75000,
      discount: 23,
      quantity: 10,
      icon: Star,
      color: '#45B7D1',
      category: 'premium',
      description: 'VIP features unlock'
    },
    {
      id: '4',
      name: 'LeBron James Avatar',
      price: 1000,
      quantity: 1,
      icon: Trophy,
      color: '#9B59B6',
      category: 'gift',
      description: 'Exclusive avatar',
      popular: true
    },
    {
      id: '5',
      name: 'Curry Celebration',
      price: 1000,
      quantity: 1,
      icon: Heart,
      color: '#F39C12',
      category: 'gift',
      description: 'Victory celebration'
    },
    {
      id: '6',
      name: 'Messi Magic',
      price: 1000,
      quantity: 1,
      icon: Gift,
      color: '#E74C3C',
      category: 'gift',
      description: 'Football legend pack'
    }
  ];

  const tabs = [
    { id: 'prediction', label: 'Predictions', icon: Zap },
    { id: 'premium', label: 'Premium', icon: Crown },
    { id: 'gift', label: 'Gift Cards', icon: Gift },
  ];

  // Load saved settings on component mount
  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      // In a real app, load from AsyncStorage or API
      const savedSettings = {
        notifications,
        phoneNumber: '',
        lastUpdated: new Date()
      };
      
      setNotifications(savedSettings.notifications);
      setPhoneNumber(savedSettings.phoneNumber);
      setLastUpdated(savedSettings.lastUpdated);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settingsData = {
        notifications,
        phoneNumber,
        lastUpdated: new Date()
      };
      
      // In a real app, save to AsyncStorage or API
      setLastUpdated(new Date());
      
      Alert.alert(
        'Settings Saved',
        'Your notification preferences have been updated successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };



  const handlePhoneNumberChange = (text: string) => {
    const formattedNumber = formatPhoneNumber(text);
    setPhoneNumber(formattedNumber);
    
    if (formattedNumber.length > 0) {
      // Remove spaces for validation
      const cleanNumber = formattedNumber.replace(/\s/g, '');
      if (!validateUgandanPhoneNumber(cleanNumber)) {
        setPhoneError('Please enter a valid Ugandan phone number (0XXX XXX XXX)');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const formatPrice = (price: number): string => {
    return `UGX ${price.toLocaleString()}`;
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePurchase = (item: StoreItem) => {
    if (phoneError || !phoneNumber) {
      Alert.alert(
        'Phone Number Required',
        'Please enter a valid Ugandan phone number to complete your purchase.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${item.name} for ${formatPrice(item.price)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Now', 
          onPress: () => {
            Alert.alert('Success', `${item.name} purchased successfully!`);
          }
        }
      ]
    );
  };

  const getFilteredItems = () => {
    return storeItems.filter(item => item.category === activeTab);
  };

  const renderDailyActivity = () => (
    <View style={[styles.dailyActivity, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>Daily Activity</Text>
        <Text style={styles.activitySubtitle}>
          Buy 3 prediction packages and get a red envelope worth UGX 10,000
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          <View style={[styles.progressStep, styles.activeStep]}>
            <Text style={styles.stepText}>1st</Text>
          </View>
          <View style={[styles.progressStep, styles.activeStep]}>
            <Text style={styles.stepText}>2nd</Text>
          </View>
          <View style={styles.progressStep}>
            <Text style={styles.stepText}>3rd</Text>
          </View>
        </View>
        <View style={styles.progressLine} />
        <TouchableOpacity style={[styles.rewardCard, { backgroundColor: '#D32F2F' }]}>
          <Text style={styles.rewardText}>Red Envelope</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabNavigation = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.7}
        >
          <tab.icon 
            size={18} 
            color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.textSecondary },
              activeTab === tab.id && { color: theme.colors.primary }
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStoreItems = () => {
    const filteredItems = getFilteredItems();
    
    return (
      <View style={styles.storeItemsContainer}>
        {filteredItems.map((item) => (
          <View
            key={item.id}
            style={[styles.storeItem, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <View style={styles.itemHeader}>
              <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
                <item.icon size={24} color="#FFFFFF" />
              </View>
              {item.popular && (
                <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.popularText}>HOT</Text>
                </View>
              )}
            </View>
            
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
              
              <View style={styles.itemPricing}>
                <Text style={[styles.itemQuantity, { color: theme.colors.textSecondary }]}>
                  {item.quantity} pieces
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.currentPrice, { color: theme.colors.primary }]}>
                    {formatPrice(item.price)}
                  </Text>
                  {item.originalPrice && (
                    <Text style={[styles.originalPrice, { color: theme.colors.textSecondary }]}>
                      {formatPrice(item.originalPrice)}
                    </Text>
                  )}
                  {item.discount && (
                    <View style={[styles.discountBadge, { backgroundColor: '#FFD700' }]}>
                      <Text style={styles.discountText}>-{item.discount}%</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.buyButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handlePurchase(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderNotificationSettings = () => (
    <View style={[styles.notificationSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Notification Preferences
      </Text>
      
      {/* Phone Number Input */}
      <View style={styles.phoneSection}>
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
          Phone Number (Uganda)
        </Text>
        <TextInput
          style={[
            styles.phoneInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: phoneError ? theme.colors.error : theme.colors.border,
            },
            Platform.select({ 
              web: { outlineStyle: 'none' as any }
            })
          ]}
          placeholder="0772 908 010"
          placeholderTextColor={theme.colors.textSecondary}
          value={phoneNumber}
          onChangeText={handlePhoneNumberChange}
          keyboardType="phone-pad"
        />
        {phoneError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {phoneError}
          </Text>
        ) : null}
      </View>

      {/* Order Management */}
      <View style={styles.notificationGroup}>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
          Order Management
        </Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <ShoppingBag size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                New Order Notifications
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Get notified when new orders are placed
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.newOrderNotifications}
            onValueChange={() => toggleNotification('newOrderNotifications')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Package size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                Order Status Updates
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Track your order progress in real-time
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.orderStatusUpdates}
            onValueChange={() => toggleNotification('orderStatusUpdates')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Truck size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                Delivery Updates
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Get updates on delivery status and timing
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.deliveryUpdates}
            onValueChange={() => toggleNotification('deliveryUpdates')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Marketing Communications */}
      <View style={styles.notificationGroup}>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
          Marketing Communications
        </Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Gift size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                Promotional Offers
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Exclusive deals and discounts in UGX
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.promotionalOffers}
            onValueChange={() => toggleNotification('promotionalOffers')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Bell size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                Store News & Updates
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Latest store features and announcements
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.storeNewsUpdates}
            onValueChange={() => toggleNotification('storeNewsUpdates')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Account & System */}
      <View style={styles.notificationGroup}>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
          Account & System
        </Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <CreditCard size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                Payment Confirmations
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Confirm successful payments and transactions
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.paymentConfirmations}
            onValueChange={() => toggleNotification('paymentConfirmations')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Shield size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                Account Security Alerts
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Important security notifications for your account
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.accountSecurityAlerts}
            onValueChange={() => toggleNotification('accountSecurityAlerts')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Settings size={20} color={theme.colors.primary} />
            <View style={styles.notificationText}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                System Maintenance Updates
              </Text>
              <Text style={[styles.notificationDesc, { color: theme.colors.textSecondary }]}>
                Scheduled maintenance and system updates
              </Text>
            </View>
          </View>
          <Switch
            value={notifications.systemMaintenanceUpdates}
            onValueChange={() => toggleNotification('systemMaintenanceUpdates')}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
          Last updated: {lastUpdated.toLocaleString()}
        </Text>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        onPress={saveSettings}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Champs Store</Text>
        <TouchableOpacity 
          onPress={() => router.push('/help-center')} 
          style={styles.headerRight}
          activeOpacity={0.7}
        >
          <Headphones size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Daily Activity Section */}
        {renderDailyActivity()}

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Store Items */}
        {renderStoreItems()}

        {/* Notification Settings */}
        {renderNotificationSettings()}
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  headerRight: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dailyActivity: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  activityHeader: {
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  activitySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeStep: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  rewardCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  storeItemsContainer: {
    padding: 16,
    gap: 16,
  },
  storeItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  itemDetails: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  itemPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#333333',
  },
  buyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  notificationSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 20,
  },
  phoneSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  phoneInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  notificationGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});