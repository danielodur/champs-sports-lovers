import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, Star, Crown, Lock, Clock as Unlock, BarChart3, Trophy, Zap, Eye, Users, Calendar, Clock, Target, Award, Shield, CircleCheck as CheckCircle, Percent } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface Prediction {
  id: string;
  type: 'free' | 'premium' | 'vip' | 'expert';
  match: string;
  league: string;
  prediction: string;
  confidence: number;
  odds: number;
  price?: number;
  author: string;
  authorLevel: string;
  authorRating: number;
  matchTime: Date;
  views: number;
  likes: number;
  accuracy: number;
  image: string;
  isLocked: boolean;
  successRate: number;
  followers: number;
  verified: boolean;
}

interface PredictionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  icon: any;
  color: string;
  popular?: boolean;
  discount?: number;
  originalPrice?: number;
}

export default function PredictionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('free');
  const { t } = useTranslation();

  // Real prediction data with UGX pricing (to be replaced with API call)
  const realPredictions: Prediction[] = [
    {
      id: '1',
      type: 'free',
      match: 'Arsenal vs Bayern Munich',
      league: 'Champions League',
      prediction: 'Arsenal to Win',
      confidence: 75,
      odds: 2.1,
      author: 'SportWee Expert',
      authorLevel: 'Pro Analyst',
      authorRating: 4.8,
      matchTime: new Date('2024-01-20T20:00:00'),
      views: 1250,
      likes: 89,
      accuracy: 78,
      image: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg',
      isLocked: false,
      successRate: 78,
      followers: 2340,
      verified: true
    },
    {
      id: '2',
      type: 'premium',
      match: 'Manchester City vs Liverpool',
      league: 'Premier League',
      prediction: 'Over 2.5 Goals',
      confidence: 85,
      odds: 1.8,
      price: 15000, // UGX 15,000
      author: 'John Analyst',
      authorLevel: 'Premium Expert',
      authorRating: 4.9,
      matchTime: new Date('2024-01-21T15:30:00'),
      views: 2100,
      likes: 156,
      accuracy: 82,
      image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg',
      isLocked: true,
      successRate: 82,
      followers: 5670,
      verified: true
    },
    {
      id: '3',
      type: 'vip',
      match: 'Real Madrid vs Barcelona',
      league: 'La Liga',
      prediction: 'Both Teams to Score',
      confidence: 90,
      odds: 1.6,
      price: 35000, // UGX 35,000
      author: 'Maria Rodriguez',
      authorLevel: 'VIP Specialist',
      authorRating: 4.95,
      matchTime: new Date('2024-01-22T18:00:00'),
      views: 3500,
      likes: 245,
      accuracy: 88,
      image: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg',
      isLocked: true,
      successRate: 88,
      followers: 12340,
      verified: true
    },
    {
      id: '4',
      type: 'expert',
      match: 'PSG vs Marseille',
      league: 'Ligue 1',
      prediction: 'PSG -1.5 Handicap',
      confidence: 95,
      odds: 2.3,
      price: 75000, // UGX 75,000
      author: 'David Expert',
      authorLevel: 'Master Predictor',
      authorRating: 4.98,
      matchTime: new Date('2024-01-23T21:00:00'),
      views: 4200,
      likes: 312,
      accuracy: 92,
      image: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg',
      isLocked: true,
      successRate: 92,
      followers: 25680,
      verified: true
    }
  ];

  const predictionTiers: PredictionTier[] = [
    {
      id: 'starter',
      name: 'Starter Package',
      description: 'Perfect for beginners',
      price: 50000, // UGX 50,000
      features: ['5 Premium Predictions', 'Basic Analysis', 'Email Support', '7-day Access'],
      icon: Target,
      color: '#4CAF50'
    },
    {
      id: 'pro',
      name: 'Pro Package',
      description: 'Advanced predictions with detailed analysis',
      price: 150000, // UGX 150,000
      originalPrice: 200000,
      discount: 25,
      features: ['20 Premium Predictions', 'Detailed Analysis', 'Live Chat Support', 'Weekly Reports', '30-day Access'],
      icon: Star,
      color: '#FF9800',
      popular: true
    },
    {
      id: 'vip',
      name: 'VIP Package',
      description: 'Exclusive VIP predictions from top experts',
      price: 350000, // UGX 350,000
      originalPrice: 450000,
      discount: 22,
      features: ['Unlimited Predictions', 'Expert Analysis', 'Priority Support', 'Exclusive Tips', 'Personal Advisor', '90-day Access'],
      icon: Crown,
      color: '#9C27B0'
    },
    {
      id: 'master',
      name: 'Master Package',
      description: 'Ultimate prediction experience',
      price: 750000, // UGX 750,000
      originalPrice: 1000000,
      discount: 25,
      features: ['All VIP Features', 'Direct Expert Contact', '24/7 Support', 'Custom Strategies', 'Risk Management', 'Lifetime Access'],
      icon: Trophy,
      color: '#E91E63'
    }
  ];

  const tabs = [
    { id: 'free', label: 'Free', icon: Unlock },
    { id: 'premium', label: 'Premium', icon: Star },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'expert', label: 'Expert', icon: Trophy }
  ];

  React.useEffect(() => {
    setPredictions(realPredictions);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const formatUGX = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

  const getFilteredPredictions = () => {
    return predictions.filter(prediction => prediction.type === activeTab);
  };

  const handlePurchasePrediction = (prediction: Prediction) => {
    if (!prediction.price) return;
    
    Alert.alert(
      'Purchase Prediction',
      `Purchase "${prediction.prediction}" prediction for ${formatUGX(prediction.price)}?\n\nExpert: ${prediction.author}\nSuccess Rate: ${prediction.successRate}%\nConfidence: ${prediction.confidence}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Now', 
          onPress: () => {
            Alert.alert('Success', 'Prediction purchased successfully! Check your predictions library.');
          }
        }
      ]
    );
  };

  const handlePurchaseTier = (tier: PredictionTier) => {
    const finalPrice = tier.originalPrice ? tier.price : tier.price;
    const savings = tier.originalPrice ? tier.originalPrice - tier.price : 0;
    
    Alert.alert(
      'Purchase Package',
      `Purchase ${tier.name} for ${formatUGX(finalPrice)}?${savings > 0 ? `\n\nYou save: ${formatUGX(savings)}` : ''}\n\nFeatures:\n${tier.features.map(f => `• ${f}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Now', 
          onPress: () => {
            Alert.alert('Success', `${tier.name} purchased successfully! Welcome to premium predictions.`);
          }
        }
      ]
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Predictions</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderTabNavigation = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { position: 'relative' }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <tab.icon 
              size={18} 
              color={activeTab === tab.id ? '#EF5350' : theme.colors.textSecondary} 
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: '#EF5350' }
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.id && (
              <View style={styles.tabIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPredictionCard = (prediction: Prediction) => (
    <TouchableOpacity
      key={prediction.id}
      style={[styles.predictionCard, { backgroundColor: theme.colors.backgroundSecondary }]}
      onPress={() => prediction.isLocked ? handlePurchasePrediction(prediction) : null}
      activeOpacity={0.8}
    >
      <Image source={{ uri: prediction.image }} style={styles.predictionImage} />
      
      {prediction.isLocked && (
        <View style={styles.lockOverlay}>
          <Lock size={32} color="#FFFFFF" />
        </View>
      )}
      
      <View style={styles.predictionContent}>
        <View style={styles.predictionHeader}>
          <View style={styles.matchInfo}>
            <Text style={[styles.matchTitle, { color: theme.colors.text }]}>
              {prediction.match}
            </Text>
            <Text style={[styles.leagueText, { color: theme.colors.textSecondary }]}>
              {prediction.league}
            </Text>
          </View>
          
          <View style={styles.typeContainer}>
            <View style={[
              styles.typeBadge, 
              { 
                backgroundColor: prediction.type === 'free' ? '#4CAF50' : 
                                prediction.type === 'premium' ? '#FF9800' :
                                prediction.type === 'vip' ? '#9C27B0' : '#E91E63'
              }
            ]}>
              <Text style={styles.typeText}>
                {prediction.type.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.predictionDetails}>
          <Text style={[styles.predictionText, { color: theme.colors.text }]}>
            {prediction.prediction}
          </Text>
          
          <View style={styles.predictionMeta}>
            <View style={styles.confidenceContainer}>
              <BarChart3 size={16} color={theme.colors.primary} />
              <Text style={[styles.confidenceText, { color: theme.colors.text }]}>
                {prediction.confidence}% confidence
              </Text>
            </View>
            
            <View style={styles.oddsContainer}>
              <TrendingUp size={16} color={theme.colors.primary} />
              <Text style={[styles.oddsText, { color: theme.colors.text }]}>
                {prediction.odds} odds
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.authorSection}>
          <View style={styles.authorInfo}>
            <View style={styles.authorHeader}>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>
                {prediction.author}
              </Text>
              {prediction.verified && (
                <CheckCircle size={16} color="#4CAF50" />
              )}
            </View>
            <Text style={[styles.authorLevel, { color: theme.colors.textSecondary }]}>
              {prediction.authorLevel}
            </Text>
            <View style={styles.authorStats}>
              <View style={styles.statItem}>
                <Star size={12} color="#FFD700" />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {prediction.authorRating}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Percent size={12} color={theme.colors.primary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {prediction.successRate}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Users size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {prediction.followers.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.engagementStats}>
            <View style={styles.statItem}>
              <Eye size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {prediction.views}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Star size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {prediction.likes}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.matchTiming}>
          <Calendar size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.matchTime, { color: theme.colors.textSecondary }]}>
            {prediction.matchTime.toLocaleDateString()} at {prediction.matchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {prediction.price && prediction.isLocked && (
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handlePurchasePrediction(prediction)}
            activeOpacity={0.8}
          >
            <Text style={styles.purchaseButtonText}>
              Unlock for {formatUGX(prediction.price)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPredictionTiers = () => (
    <View style={styles.tiersSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('predictions.packages.title')}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
        {t('predictions.packages.subtitle')}
      </Text>
      
      <View style={styles.tiersList}>
        {predictionTiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.tierCard, 
              { 
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: tier.popular ? theme.colors.primary : 'transparent',
                borderWidth: tier.popular ? 2 : 0
              }
            ]}
            onPress={() => handlePurchaseTier(tier)}
            activeOpacity={0.8}
          >
            {tier.popular && (
              <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            
            <View style={styles.tierHeader}>
              <View style={[styles.tierIcon, { backgroundColor: tier.color }]}>
                <tier.icon size={24} color="#FFFFFF" />
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
              <Text style={[styles.tierPrice, { color: theme.colors.primary }]}>
                {formatUGX(tier.price)}
              </Text>
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
              style={[styles.tierButton, { backgroundColor: tier.color }]}
              onPress={() => handlePurchaseTier(tier)}
              activeOpacity={0.8}
            >
              <Text style={styles.tierButtonText}>{t('predictions.packages.choosePlan')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPredictionsList = () => {
    const filteredPredictions = getFilteredPredictions();
    
    return (
      <View style={styles.predictionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t(activeTab.charAt(0).toUpperCase() + activeTab.slice(1)) + ' ' + t('predictions.predictions') + ' (' + filteredPredictions.length + ')'
        }
        </Text>
        
        {filteredPredictions.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              {t('predictions.empty.noPredictions')}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              {t('predictions.empty.checkBackLater')}
            </Text>
          </View>
        ) : (
          <View style={styles.predictionsList}>
            {filteredPredictions.map(renderPredictionCard)}
          </View>
        )}
      </View>
    );
  };

  const renderMarketplaceInfo = () => (
    <View style={[styles.marketplaceInfo, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.infoHeader}>
        <Shield size={24} color={theme.colors.primary} />
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          {t('predictions.marketplace.title')}
        </Text>
      </View>
      
      <Text style={[styles.infoDescription, { color: theme.colors.textSecondary }]}>
        {t('predictions.marketplace.description')}
      </Text>
      
      <View style={styles.infoFeatures}>
        <View style={styles.infoFeature}>
          <Award size={20} color={theme.colors.primary} />
          <Text style={[styles.infoFeatureText, { color: theme.colors.text }]}>
            {t('predictions.marketplace.verifiedExperts')}
          </Text>
        </View>
        <View style={styles.infoFeature}>
          <BarChart3 size={20} color={theme.colors.primary} />
          <Text style={[styles.infoFeatureText, { color: theme.colors.text }]}>
            {t('predictions.marketplace.detailedAnalysis')}
          </Text>
        </View>
        <View style={styles.infoFeature}>
          <TrendingUp size={20} color={theme.colors.primary} />
          <Text style={[styles.infoFeatureText, { color: theme.colors.text }]}>
            {t('predictions.marketplace.highSuccessRate')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabNavigation()}
      
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
        {activeTab === 'free' && renderMarketplaceInfo()}
        {activeTab === 'free' && renderPredictionTiers()}
        {renderPredictionsList()}
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
    borderBottomColor: '#4A4A4A',
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
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A4A',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 60,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '25%',
    right: '25%',
    height: 4,
    backgroundColor: '#EF5350',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  marketplaceInfo: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  infoDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoFeature: {
    alignItems: 'center',
    flex: 1,
  },
  infoFeatureText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  tiersSection: {
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
  tiersList: {
    gap: 16,
    marginBottom: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  tierPricing: {
    marginBottom: 16,
  },
  tierPrice: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  originalPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
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
  },
  tierButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tierButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  predictionsContainer: {
    paddingHorizontal: 16,
  },
  predictionsList: {
    gap: 16,
  },
  predictionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  predictionImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionContent: {
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  leagueText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  typeContainer: {
    marginLeft: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  predictionDetails: {
    marginBottom: 12,
  },
  predictionText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  predictionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  oddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oddsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  authorLevel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  authorStats: {
    flexDirection: 'row',
    gap: 12,
  },
  engagementStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  matchTiming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  matchTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  purchaseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});