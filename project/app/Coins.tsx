import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, ArrowUpDown, Star, BarChart3, DollarSign, Zap, Gift, Trophy, Crown, Target, CircleHelp as HelpCircle, MessageCircle, Banknote } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  icon: any;
  color: string;
  category: 'basic' | 'premium' | 'special';
  description: string;
  popular?: boolean;
  bonus?: number;
}

type SortOption = 'price' | 'coins' | 'value' | 'popular';
type SortDirection = 'asc' | 'desc';

export default function CoinsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<CoinPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeCategory, setActiveCategory] = useState('all');
  const [userCoins, setUserCoins] = useState(0);

  // Mock coin packages data
  const mockCoinPackages: CoinPackage[] = [
    {
      id: '1',
      name: 'Starter Pack',
      coins: 60,
      price: 6000,
      icon: Gift,
      color: '#4CAF50',
      category: 'basic',
      description: 'Perfect for beginners',
      popular: false
    },
    {
      id: '2',
      name: 'Popular Pack',
      coins: 500,
      price: 50000,
      originalPrice: 60000,
      discount: 17,
      icon: Star,
      color: '#FF9800',
      category: 'premium',
      description: 'Most popular choice',
      popular: true,
      bonus: 50
    },
    {
      id: '3',
      name: 'Value Pack',
      coins: 1000,
      price: 98000,
      originalPrice: 120000,
      discount: 18,
      icon: Target,
      color: '#2196F3',
      category: 'premium',
      description: 'Best value for money',
      popular: false,
      bonus: 100
    },
    {
      id: '4',
      name: 'Mega Pack',
      coins: 2000,
      price: 198000,
      originalPrice: 240000,
      discount: 18,
      icon: Crown,
      color: '#9C27B0',
      category: 'special',
      description: 'Maximum coins',
      popular: false,
      bonus: 200
    },
    {
      id: '5',
      name: 'Super Pack',
      coins: 5000,
      price: 488000,
      originalPrice: 600000,
      discount: 19,
      icon: Trophy,
      color: '#FF5722',
      category: 'special',
      description: 'Ultimate package',
      popular: false,
      bonus: 500
    },
    {
      id: '6',
      name: 'Elite Pack',
      coins: 10000,
      price: 998000,
      originalPrice: 1200000,
      discount: 17,
      icon: Zap,
      color: '#E91E63',
      category: 'special',
      description: 'Elite tier package',
      popular: false,
      bonus: 1000
    }
  ];

  const categories = [
    { id: 'all', label: 'All Packages' },
    { id: 'basic', label: 'Basic' },
    { id: 'premium', label: 'Premium' },
    { id: 'special', label: 'Special' },
  ];

  const sortOptions: { id: SortOption; label: string; icon: any }[] = [
    { id: 'popular', label: 'Popular', icon: Star },
    { id: 'price', label: 'Price (UGX)', icon: Banknote },
    { id: 'coins', label: 'Coins', icon: BarChart3 },
    { id: 'value', label: 'Value', icon: Target }
  ];

  React.useEffect(() => {
    setCoinPackages(mockCoinPackages);
    setFilteredPackages(mockCoinPackages);
  }, []);

  React.useEffect(() => {
    filterAndSortPackages();
  }, [coinPackages, searchQuery, sortBy, sortDirection, activeCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const filterAndSortPackages = () => {
    let filtered = coinPackages;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query)
      );
    }

    if (activeCategory !== 'all') {
      filtered = filtered.filter(pkg => pkg.category === activeCategory);
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'coins':
          aValue = a.coins;
          bValue = b.coins;
          break;
        case 'value':
          aValue = a.coins / a.price;
          bValue = b.coins / b.price;
          break;
        case 'popular':
          aValue = a.popular ? 1 : 0;
          bValue = b.popular ? 1 : 0;
          break;
        default:
          aValue = a.popular ? 1 : 0;
          bValue = b.popular ? 1 : 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredPackages(filtered);
  };

  const formatUGX = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const handlePurchase = (pkg: CoinPackage) => {
    Alert.alert(
      'Purchase Coins',
      `Purchase ${pkg.coins} coins for ${formatUGX(pkg.price)}?\n\n${pkg.bonus ? `Bonus: +${pkg.bonus} coins included!` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Now', 
          onPress: () => {
            setUserCoins(prev => prev + pkg.coins + (pkg.bonus || 0));
            Alert.alert('Success', `${pkg.coins + (pkg.bonus || 0)} coins added to your account!`);
          }
        }
      ]
    );
  };

  const handleCustomerService = () => {
    Alert.alert(
      'Customer Service',
      'Contact our customer service team for assistance with your coins.',
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Coins Store</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderCoinsBalance = () => (
    <View style={[styles.balanceCard, { backgroundColor: '#FF9800' }]}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Coin Balance</Text>
        <Text style={styles.balanceNote}>Coins cannot be withdrawn or refunded</Text>
      </View>
      
      <Text style={styles.balanceAmount}>{userCoins}</Text>
      
      <View style={styles.balanceFooter}>
        <Text style={styles.balanceDescription}>
          Use coins to purchase premium features, predictions, and exclusive content
        </Text>
      </View>
    </View>
  );

  const renderSearchAndSort = () => (
    <View style={styles.searchSortContainer}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            { 
              color: theme.colors.text,
              ...Platform.select({ web: { outlineStyle: 'none' } })
            }
          ]}
          placeholder="Search coin packages..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              {
                backgroundColor: activeCategory === category.id ? theme.colors.primary : theme.colors.backgroundSecondary,
              }
            ]}
            onPress={() => setActiveCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryButtonText,
                {
                  color: activeCategory === category.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortContainer}
      >
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.sortButton,
              {
                backgroundColor: sortBy === option.id ? theme.colors.primary : theme.colors.backgroundSecondary,
              }
            ]}
            onPress={() => handleSort(option.id)}
            activeOpacity={0.7}
          >
            <option.icon 
              size={16} 
              color={sortBy === option.id ? '#FFFFFF' : theme.colors.text} 
            />
            <Text
              style={[
                styles.sortButtonText,
                {
                  color: sortBy === option.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
            {sortBy === option.id && (
              <ArrowUpDown size={12} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCoinPackage = (pkg: CoinPackage) => (
    <View
      key={pkg.id}
      style={[styles.packageItem, { backgroundColor: theme.colors.backgroundSecondary }]}
    >
      <View style={styles.packageHeader}>
        <View style={[styles.packageIcon, { backgroundColor: pkg.color }]}>
          <pkg.icon size={24} color="#FFFFFF" />
        </View>
        {pkg.popular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}
        {pkg.discount && (
          <View style={[styles.discountBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.discountText}>-{pkg.discount}%</Text>
          </View>
        )}
      </View>
      
      <View style={styles.packageDetails}>
        <Text style={[styles.packageName, { color: theme.colors.text }]}>
          {pkg.name}
        </Text>
        <Text style={[styles.packageDescription, { color: theme.colors.textSecondary }]}>
          {pkg.description}
        </Text>
        
        <View style={styles.packageCoins}>
          <Text style={[styles.coinsAmount, { color: theme.colors.text }]}>
            {pkg.coins} coins
          </Text>
          {pkg.bonus && (
            <Text style={[styles.bonusText, { color: '#4CAF50' }]}>
              +{pkg.bonus} bonus
            </Text>
          )}
        </View>
        
        <View style={styles.packagePricing}>
          <Text style={[styles.currentPrice, { color: theme.colors.primary }]}>
            {formatUGX(pkg.price)}
          </Text>
          {pkg.originalPrice && (
            <Text style={[styles.originalPrice, { color: theme.colors.textSecondary }]}>
              {formatUGX(pkg.originalPrice)}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.buyButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => handlePurchase(pkg)}
        activeOpacity={0.8}
      >
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPackagesList = () => (
    <View style={styles.packagesContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Available Packages ({filteredPackages.length})
      </Text>
      
      {filteredPackages.length === 0 ? (
        <View style={styles.emptyState}>
          <Gift size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            {searchQuery ? 'No packages match your search' : 'No packages available'}
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new packages'}
          </Text>
        </View>
      ) : (
        <View style={styles.packagesList}>
          {filteredPackages.map(renderCoinPackage)}
        </View>
      )}
    </View>
  );

  const renderUsageInfo = () => (
    <View style={[styles.usageSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.usageTitle, { color: theme.colors.text }]}>
        What can you buy with coins?
      </Text>
      
      <View style={styles.usageGrid}>
        <View style={styles.usageItem}>
          <BarChart3 size={24} color={theme.colors.primary} />
          <Text style={[styles.usageLabel, { color: theme.colors.text }]}>Match Analysis</Text>
          <Text style={[styles.usageDescription, { color: theme.colors.textSecondary }]}>
            Premium match predictions and insights
          </Text>
        </View>
        
        <View style={styles.usageItem}>
          <Target size={24} color={theme.colors.primary} />
          <Text style={[styles.usageLabel, { color: theme.colors.text }]}>SportWee Number</Text>
          <Text style={[styles.usageDescription, { color: theme.colors.textSecondary }]}>
            Exclusive prediction numbers
          </Text>
        </View>
        
        <View style={styles.usageItem}>
          <Gift size={24} color={theme.colors.primary} />
          <Text style={[styles.usageLabel, { color: theme.colors.text }]}>Gift Cards</Text>
          <Text style={[styles.usageDescription, { color: theme.colors.textSecondary }]}>
            Special avatars and celebrations
          </Text>
        </View>
        
        <View style={styles.usageItem}>
          <Trophy size={24} color={theme.colors.primary} />
          <Text style={[styles.usageLabel, { color: theme.colors.text }]}>Game Consumption</Text>
          <Text style={[styles.usageDescription, { color: theme.colors.textSecondary }]}>
            Interactive games and features
          </Text>
        </View>
      </View>
    </View>
  );

  const renderImportantReminders = () => (
    <View style={[styles.remindersSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.remindersTitle, { color: theme.colors.text }]}>Important Reminders:</Text>
      
      <View style={styles.remindersList}>
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>1.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            SportWee is not a gambling platform. Once SportWee coins or gold coins are topped up successfully, they do not support cash withdrawal, refund, or gambling operations.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>2.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            Before using this top-up service, you must confirm that you are over 18 years old. If you are a minor, your use of this service will be deemed to have obtained guardian consent.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>3.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            Top-up may take some time and may be delayed. Please be patient.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>4.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            If the top-up is not received, please click "Top-up not received" for self-service processing. Apple top-up users can only process normally when the purchase record status changes to order number.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>5.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            For other top-up issues, please contact SportWee online customer service.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCustomerService = () => (
    <View style={[styles.customerServiceSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.customerServiceHeader}>
        <HelpCircle size={24} color={theme.colors.primary} />
        <Text style={[styles.customerServiceTitle, { color: theme.colors.text }]}>
          Not yet received?
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.serviceButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCustomerService}
        activeOpacity={0.8}
      >
        <MessageCircle size={20} color="#FFFFFF" />
        <Text style={styles.serviceButtonText}>Contact Customer Service</Text>
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
        {renderCoinsBalance()}
        {renderSearchAndSort()}
        {renderPackagesList()}
        {renderUsageInfo()}
        {renderImportantReminders()}
        {renderCustomerService()}
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
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  balanceNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  balanceFooter: {
    marginTop: 8,
  },
  balanceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  searchSortContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryContainer: {
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sortScroll: {
    marginBottom: 8,
  },
  sortContainer: {
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  packagesContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  packagesList: {
    gap: 16,
    marginBottom: 24,
  },
  packageItem: {
    padding: 16,
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
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageIcon: {
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
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    top: -8,
    right: -8,
  },
  discountText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  packageDetails: {
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  packageCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  coinsAmount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  bonusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  originalPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textDecorationLine: 'line-through',
  },
  buyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  usageSection: {
    margin: 16,
    padding: 16,
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
  usageTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  usageItem: {
    width: '47%',
    alignItems: 'center',
    padding: 12,
  },
  usageLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  usageDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  remindersSection: {
    margin: 16,
    padding: 16,
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
  remindersTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderNumber: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
    marginTop: 2,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  customerServiceSection: {
    margin: 16,
    padding: 16,
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
  customerServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerServiceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  serviceButtonText: {
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