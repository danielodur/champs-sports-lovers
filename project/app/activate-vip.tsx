import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Platform,
  Image,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Crown, Star, Shield, Zap, CircleCheck as CheckCircle, Gift, Trophy, Users, MessageCircle, Clock, Infinity, TrendingUp, BarChart3, Target, Award, Sparkles, Calendar, CreditCard, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface VIPTier {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  period: string;
  icon: any;
  color: string;
  popular?: boolean;
  features: string[];
  savings?: string;
}

interface VIPFeature {
  icon: any;
  title: string;
  description: string;
  color: string;
}

export default function ActivateVIPScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('annual');
  const [pulseAnim] = useState(new Animated.Value(1));
  const { t } = useTranslation();

  // VIP Subscription Tiers
  const vipTiers: VIPTier[] = [
    {
      id: 'monthly',
      name: 'Monthly VIP',
      description: 'Perfect for trying VIP features',
      price: 25000, // UGX 25,000/month
      period: 'month',
      icon: Calendar,
      color: '#4CAF50',
      features: [
        'Ad-free experience',
        'Premium predictions access',
        'Priority customer support',
        'Exclusive content',
        'Advanced analytics',
        'Monthly expert insights'
      ]
    },
    {
      id: 'annual',
      name: 'Annual VIP',
      description: 'Best value with maximum savings',
      price: 199000, // UGX 199,000/year
      originalPrice: 300000, // UGX 300,000 (25k x 12)
      discount: 34,
      period: 'year',
      icon: Crown,
      color: '#FF9800',
      popular: true,
      savings: 'Save UGX 101,000',
      features: [
        'All Monthly VIP features',
        'Unlimited premium predictions',
        'VIP-only tournaments',
        'Personal account manager',
        'Early access to new features',
        'Exclusive VIP community',
        'Priority match notifications',
        'Advanced statistics dashboard',
        'Custom prediction alerts',
        'VIP badge and recognition'
      ]
    },
    {
      id: 'lifetime',
      name: 'Lifetime VIP',
      description: 'One-time payment, lifetime access',
      price: 750000, // UGX 750,000 one-time
      originalPrice: 1000000,
      discount: 25,
      period: 'lifetime',
      icon: Infinity,
      color: '#9C27B0',
      savings: 'Save UGX 250,000',
      features: [
        'All Annual VIP features',
        'Lifetime access guarantee',
        'Exclusive lifetime member perks',
        'Priority feature requests',
        'Lifetime customer support',
        'Special lifetime badge',
        'Access to beta features',
        'Lifetime price protection',
        'VIP legacy status',
        'Exclusive lifetime events'
      ]
    }
  ];

  // Ad-Free Experience Option
  const adFreeOption = {
    id: 'ad-free',
    name: 'Ad-Free Experience',
    description: 'Remove all advertisements permanently',
    price: 50000, // UGX 50,000 one-time
    period: 'one-time',
    icon: Shield,
    color: '#2196F3',
    features: [
      'Remove all banner ads',
      'Remove video advertisements',
      'Remove sponsored content',
      'Clean, distraction-free interface',
      'Faster app performance',
      'Reduced data usage'
    ]
  };

  // VIP Features Showcase
  const vipFeatures: VIPFeature[] = [
    {
      icon: Target,
      title: 'Premium Predictions',
      description: 'Access to expert predictions with 90%+ accuracy',
      color: '#4CAF50'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Detailed match statistics and performance insights',
      color: '#2196F3'
    },
    {
      icon: Users,
      title: 'VIP Community',
      description: 'Exclusive access to VIP-only discussions and tips',
      color: '#FF9800'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: '24/7 premium customer support with instant response',
      color: '#9C27B0'
    },
    {
      icon: Trophy,
      title: 'Exclusive Tournaments',
      description: 'Participate in VIP-only prediction competitions',
      color: '#E91E63'
    },
    {
      icon: Award,
      title: 'VIP Recognition',
      description: 'Special badges and recognition in the community',
      color: '#FF5722'
    }
  ];

  React.useEffect(() => {
    // Pulse animation for popular badge
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const formatUGX = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

  const handleSubscribe = (tier: VIPTier) => {
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${tier.name} for ${formatUGX(tier.price)}/${tier.period}?${tier.savings ? `\n\n${tier.savings}` : ''}\n\nFeatures included:\n${tier.features.slice(0, 3).map(f => `• ${f}`).join('\n')}${tier.features.length > 3 ? `\n• And ${tier.features.length - 3} more...` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Subscribe Now', 
          onPress: () => {
            // Here you would integrate with RevenueCat for actual payments
            Alert.alert('Success', `${tier.name} activated successfully! Welcome to VIP!`);
          }
        }
      ]
    );
  };

  const handleAdFreePurchase = () => {
    Alert.alert(
      'Purchase Ad-Free Experience',
      `Remove all ads for ${formatUGX(adFreeOption.price)} (one-time payment)?\n\nFeatures:\n${adFreeOption.features.map(f => `• ${f}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purchase Now', 
          onPress: () => {
            Alert.alert('Success', 'Ad-free experience activated! Enjoy your clean interface.');
          }
        }
      ]
    );
  };

  const handleCustomerSupport = () => {
    Alert.alert(
      'VIP Support',
      'Contact our VIP support team for assistance with subscriptions and billing.',
      [{ text: 'OK' }]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Activate VIP</Text>
      <TouchableOpacity 
        style={styles.helpButton}
        onPress={handleCustomerSupport}
        activeOpacity={0.7}
      >
        <HelpCircle size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderHeroSection = () => (
    <View style={[styles.heroSection, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.heroContent}>
        <View style={styles.heroIcon}>
          <Crown size={48} color="#FFFFFF" />
          <Sparkles size={24} color="#FFD700" style={styles.sparkleIcon} />
        </View>
        <Text style={styles.heroTitle}>Unlock VIP Experience</Text>
        <Text style={styles.heroSubtitle}>
          Join thousands of VIP members enjoying premium features, exclusive content, and priority support
        </Text>
      </View>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg' }}
        style={styles.heroImage}
        resizeMode="cover"
      />
    </View>
  );

  const renderVIPFeatures = () => (
    <View style={styles.featuresSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        VIP Features & Benefits
      </Text>
      
      <View style={styles.featuresGrid}>
        {vipFeatures.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureCard, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
              <feature.icon size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
              {feature.title}
            </Text>
            <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
              {feature.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSubscriptionTiers = () => (
    <View style={styles.tiersSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Choose Your VIP Plan
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
        Select the perfect plan for your needs
      </Text>
      
      <View style={styles.tiersList}>
        {vipTiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.tierCard,
              { 
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: selectedTier === tier.id ? theme.colors.primary : 'transparent',
                borderWidth: selectedTier === tier.id ? 2 : 0
              }
            ]}
            onPress={() => setSelectedTier(tier.id)}
            activeOpacity={0.8}
          >
            {tier.popular && (
              <Animated.View 
                style={[
                  styles.popularBadge, 
                  { 
                    backgroundColor: theme.colors.primary,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <Star size={16} color="#FFFFFF" />
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </Animated.View>
            )}
            
            <View style={styles.tierHeader}>
              <View style={[styles.tierIcon, { backgroundColor: tier.color }]}>
                <tier.icon size={32} color="#FFFFFF" />
              </View>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierName, { color: theme.colors.text }]}>
                  {tier.name}
                </Text>
                <Text style={[styles.tierDescription, { color: theme.colors.textSecondary }]}>
                  {tier.description}
                </Text>
              </View>
            </View>
            
            <View style={styles.tierPricing}>
              <View style={styles.priceContainer}>
                <Text style={[styles.tierPrice, { color: theme.colors.primary }]}>
                  {formatUGX(tier.price)}
                </Text>
                <Text style={[styles.tierPeriod, { color: theme.colors.textSecondary }]}>
                  /{tier.period}
                </Text>
              </View>
              {tier.originalPrice && (
                <View style={styles.originalPricing}>
                  <Text style={[styles.originalPrice, { color: theme.colors.textSecondary }]}>
                    {formatUGX(tier.originalPrice)}
                  </Text>
                  <View style={[styles.discountBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.discountText}>-{tier.discount}%</Text>
                  </View>
                </View>
              )}
              {tier.savings && (
                <Text style={[styles.savingsText, { color: '#4CAF50' }]}>
                  {tier.savings}
                </Text>
              )}
            </View>
            
            <View style={styles.tierFeatures}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <CheckCircle size={16} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { 
                  backgroundColor: selectedTier === tier.id ? theme.colors.primary : tier.color
                }
              ]}
              onPress={() => handleSubscribe(tier)}
              activeOpacity={0.8}
            >
              <CreditCard size={20} color="#FFFFFF" />
              <Text style={styles.subscribeButtonText}>
                {selectedTier === tier.id ? 'Subscribe Now' : 'Select Plan'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAdFreeOption = () => (
    <View style={[styles.adFreeSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.adFreeHeader}>
        <View style={[styles.adFreeIcon, { backgroundColor: adFreeOption.color }]}>
          <Shield size={32} color="#FFFFFF" />
        </View>
        <View style={styles.adFreeInfo}>
          <Text style={[styles.adFreeTitle, { color: theme.colors.text }]}>
            {adFreeOption.name}
          </Text>
          <Text style={[styles.adFreeDescription, { color: theme.colors.textSecondary }]}>
            {adFreeOption.description}
          </Text>
        </View>
      </View>
      
      <View style={styles.adFreePrice}>
        <Text style={[styles.adFreePriceText, { color: theme.colors.primary }]}>
          {formatUGX(adFreeOption.price)}
        </Text>
        <Text style={[styles.adFreePeriod, { color: theme.colors.textSecondary }]}>
          one-time payment
        </Text>
      </View>
      
      <View style={styles.adFreeFeatures}>
        {adFreeOption.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle size={16} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[styles.adFreeButton, { backgroundColor: adFreeOption.color }]}
        onPress={handleAdFreePurchase}
        activeOpacity={0.8}
      >
        <Shield size={20} color="#FFFFFF" />
        <Text style={styles.adFreeButtonText}>Purchase Ad-Free</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentSecurity = () => (
    <View style={[styles.securitySection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.securityHeader}>
        <Shield size={24} color={theme.colors.primary} />
        <Text style={[styles.securityTitle, { color: theme.colors.text }]}>
          Secure Payment & Billing
        </Text>
      </View>
      
      <View style={styles.securityFeatures}>
        <View style={styles.securityItem}>
          <CheckCircle size={16} color="#4CAF50" />
          <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
            256-bit SSL encryption
          </Text>
        </View>
        <View style={styles.securityItem}>
          <CheckCircle size={16} color="#4CAF50" />
          <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
            Secure payment processing
          </Text>
        </View>
        <View style={styles.securityItem}>
          <CheckCircle size={16} color="#4CAF50" />
          <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
            Cancel anytime, no hidden fees
          </Text>
        </View>
        <View style={styles.securityItem}>
          <CheckCircle size={16} color="#4CAF50" />
          <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
            30-day money-back guarantee
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCustomerSupport = () => (
    <View style={[styles.supportSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.supportHeader}>
        <MessageCircle size={24} color={theme.colors.primary} />
        <Text style={[styles.supportTitle, { color: theme.colors.text }]}>
          Need Help?
        </Text>
      </View>
      
      <Text style={[styles.supportDescription, { color: theme.colors.textSecondary }]}>
        Our VIP support team is here to help you with any questions about subscriptions, billing, or features.
      </Text>
      
      <TouchableOpacity
        style={[styles.supportButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCustomerSupport}
        activeOpacity={0.8}
      >
        <MessageCircle size={20} color="#FFFFFF" />
        <Text style={styles.supportButtonText}>Contact VIP Support</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderHeroSection()}
        {renderVIPFeatures()}
        {renderSubscriptionTiers()}
        {renderAdFreeOption()}
        {renderPaymentSecurity()}
        {renderCustomerSupport()}
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
  helpButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  heroIcon: {
    position: 'relative',
    marginBottom: 16,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  featuresSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
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
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  tiersSection: {
    padding: 16,
  },
  tiersList: {
    gap: 20,
  },
  tierCard: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  tierPricing: {
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  tierPeriod: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  originalPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 16,
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
    color: '#FFFFFF',
  },
  savingsText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  tierFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  adFreeSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adFreeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adFreeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adFreeInfo: {
    flex: 1,
  },
  adFreeTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  adFreeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  adFreePrice: {
    alignItems: 'center',
    marginBottom: 16,
  },
  adFreePriceText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  adFreePeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  adFreeFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  adFreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  adFreeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  securitySection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  securityFeatures: {
    gap: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  supportSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  supportDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});