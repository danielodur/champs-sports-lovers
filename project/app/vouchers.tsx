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
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Gift, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, CircleHelp as HelpCircle, MessageCircle, Calendar, Tag, Star } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface Voucher {
  id: string;
  type: 'discount' | 'cashback' | 'freebie';
  title: string;
  description: string;
  value: number;
  originalValue?: number;
  discount?: number;
  expiryDate: Date;
  status: 'active' | 'used' | 'expired';
  category: string;
  code: string;
  minSpend?: number;
  image: string;
}

type FilterType = 'all' | 'active' | 'used' | 'expired' | 'discount' | 'cashback' | 'freebie';

export default function VouchersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [voucherBalance, setVoucherBalance] = useState(0);

  // Mock voucher data
  const mockVouchers: Voucher[] = [
    {
      id: '1',
      type: 'discount',
      title: '50% Off Premium Predictions',
      description: 'Get 50% discount on all premium match predictions',
      value: 25000,
      originalValue: 50000,
      discount: 50,
      expiryDate: new Date('2024-02-15'),
      status: 'active',
      category: 'Predictions',
      code: 'PRED50',
      minSpend: 10000,
      image: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg'
    },
    {
      id: '2',
      type: 'cashback',
      title: 'UGX 10,000 Cashback',
      description: 'Get UGX 10,000 cashback on your next purchase',
      value: 10000,
      expiryDate: new Date('2024-02-20'),
      status: 'active',
      category: 'Wallet',
      code: 'CASH10K',
      minSpend: 50000,
      image: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg'
    },
    {
      id: '3',
      type: 'freebie',
      title: 'Free SportWee Avatar',
      description: 'Claim your free exclusive SportWee avatar',
      value: 5000,
      expiryDate: new Date('2024-03-01'),
      status: 'active',
      category: 'Avatars',
      code: 'FREEAVATAR',
      image: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg'
    },
    {
      id: '4',
      type: 'discount',
      title: '30% Off Coin Packages',
      description: 'Save 30% on all coin packages',
      value: 15000,
      originalValue: 50000,
      discount: 30,
      expiryDate: new Date('2024-01-10'),
      status: 'expired',
      category: 'Coins',
      code: 'COIN30',
      minSpend: 20000,
      image: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg'
    },
    {
      id: '5',
      type: 'cashback',
      title: 'UGX 5,000 Welcome Bonus',
      description: 'Welcome bonus for new users',
      value: 5000,
      expiryDate: new Date('2024-01-05'),
      status: 'used',
      category: 'Welcome',
      code: 'WELCOME5K',
      image: 'https://images.pexels.com/photos/4761663/pexels-photo-4761663.jpeg'
    }
  ];

  const filterOptions: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'used', label: 'Used' },
    { id: 'expired', label: 'Expired' },
    { id: 'discount', label: 'Discounts' },
    { id: 'cashback', label: 'Cashback' },
    { id: 'freebie', label: 'Freebies' }
  ];

  React.useEffect(() => {
    setVouchers(mockVouchers);
    setFilteredVouchers(mockVouchers);
  }, []);

  React.useEffect(() => {
    filterVouchers();
  }, [vouchers, searchQuery, activeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const filterVouchers = () => {
    let filtered = vouchers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(voucher => 
        voucher.title.toLowerCase().includes(query) ||
        voucher.description.toLowerCase().includes(query) ||
        voucher.category.toLowerCase().includes(query) ||
        voucher.code.toLowerCase().includes(query)
      );
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(voucher => {
        switch (activeFilter) {
          case 'active':
          case 'used':
          case 'expired':
            return voucher.status === activeFilter;
          case 'discount':
          case 'cashback':
          case 'freebie':
            return voucher.type === activeFilter;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return b.expiryDate.getTime() - a.expiryDate.getTime();
    });

    setFilteredVouchers(filtered);
  };

  const formatUGX = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'used':
        return <CheckCircle size={16} color="#9E9E9E" />;
      case 'expired':
        return <XCircle size={16} color="#F44336" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'used':
        return '#9E9E9E';
      case 'expired':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Tag size={20} color="#FF9800" />;
      case 'cashback':
        return <Gift size={20} color="#4CAF50" />;
      case 'freebie':
        return <Star size={20} color="#9C27B0" />;
      default:
        return <Gift size={20} color="#9E9E9E" />;
    }
  };

  const handleUseVoucher = (voucher: Voucher) => {
    if (voucher.status !== 'active') {
      Alert.alert('Voucher Unavailable', 'This voucher is not available for use.');
      return;
    }

    Alert.alert(
      'Use Voucher',
      `Use "${voucher.title}" voucher?\n\nCode: ${voucher.code}\nValue: ${formatUGX(voucher.value)}${voucher.minSpend ? `\nMinimum spend: ${formatUGX(voucher.minSpend)}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Now', 
          onPress: () => {
            setVouchers(prev => 
              prev.map(v => 
                v.id === voucher.id ? { ...v, status: 'used' as const } : v
              )
            );
            Alert.alert('Success', 'Voucher applied successfully!');
          }
        }
      ]
    );
  };

  const handleCustomerService = () => {
    Alert.alert(
      'Customer Service',
      'Contact our customer service team for assistance with your vouchers.',
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Vouchers</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderVoucherBalance = () => (
    <View style={[styles.balanceCard, { backgroundColor: '#2ED573' }]}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Available Vouchers</Text>
        <Gift size={24} color="#FFFFFF" />
      </View>
      
      <Text style={styles.balanceAmount}>{voucherBalance}</Text>
      
      <View style={styles.balanceFooter}>
        <Text style={styles.balanceDescription}>
          Use vouchers to get discounts, cashback, and free items
        </Text>
      </View>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
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
          placeholder="Search vouchers..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilter === option.id ? theme.colors.primary : theme.colors.backgroundSecondary,
              }
            ]}
            onPress={() => setActiveFilter(option.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: activeFilter === option.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVoucherItem = (voucher: Voucher) => (
    <TouchableOpacity
      key={voucher.id}
      style={[
        styles.voucherItem, 
        { 
          backgroundColor: theme.colors.backgroundSecondary,
          opacity: voucher.status === 'active' ? 1 : 0.7
        }
      ]}
      onPress={() => handleUseVoucher(voucher)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: voucher.image }} style={styles.voucherImage} />
      
      <View style={styles.voucherContent}>
        <View style={styles.voucherHeader}>
          <View style={styles.voucherTypeContainer}>
            {getTypeIcon(voucher.type)}
            <Text style={[styles.voucherCategory, { color: theme.colors.textSecondary }]}>
              {voucher.category}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {getStatusIcon(voucher.status)}
            <Text style={[styles.statusText, { color: getStatusColor(voucher.status) }]}>
              {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.voucherTitle, { color: theme.colors.text }]}>
          {voucher.title}
        </Text>
        <Text style={[styles.voucherDescription, { color: theme.colors.textSecondary }]}>
          {voucher.description}
        </Text>
        
        <View style={styles.voucherDetails}>
          <View style={styles.voucherValue}>
            <Text style={[styles.currentValue, { color: theme.colors.primary }]}>
              {formatUGX(voucher.value)}
            </Text>
            {voucher.originalValue && (
              <Text style={[styles.originalValue, { color: theme.colors.textSecondary }]}>
                {formatUGX(voucher.originalValue)}
              </Text>
            )}
            {voucher.discount && (
              <View style={[styles.discountBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.discountText}>-{voucher.discount}%</Text>
              </View>
            )}
          </View>
          
          <View style={styles.voucherMeta}>
            <View style={styles.expiryContainer}>
              <Calendar size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.expiryText, { color: theme.colors.textSecondary }]}>
                Expires: {voucher.expiryDate.toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.voucherCode, { color: theme.colors.text }]}>
              Code: {voucher.code}
            </Text>
            {voucher.minSpend && (
              <Text style={[styles.minSpend, { color: theme.colors.textSecondary }]}>
                Min spend: {formatUGX(voucher.minSpend)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVouchersList = () => (
    <View style={styles.vouchersContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Your Vouchers ({filteredVouchers.length})
      </Text>
      
      {filteredVouchers.length === 0 ? (
        <View style={styles.emptyState}>
          <Gift size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            {searchQuery || activeFilter !== 'all' ? 'No vouchers match your search' : 'No vouchers available'}
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            {searchQuery || activeFilter !== 'all' ? 'Try adjusting your search or filters' : 'Check back later for new vouchers'}
          </Text>
        </View>
      ) : (
        <View style={styles.vouchersList}>
          {filteredVouchers.map(renderVoucherItem)}
        </View>
      )}
    </View>
  );

  const renderImportantReminders = () => (
    <View style={[styles.remindersSection, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.remindersTitle, { color: theme.colors.text }]}>Important Reminders:</Text>
      
      <View style={styles.remindersList}>
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>1.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            Vouchers have expiry dates. Please use them before they expire.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>2.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            Some vouchers have minimum spend requirements. Check the details before use.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>3.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            Vouchers cannot be combined with other offers unless specified.
          </Text>
        </View>
        
        <View style={styles.reminderItem}>
          <Text style={[styles.reminderNumber, { color: theme.colors.primary }]}>4.</Text>
          <Text style={[styles.reminderText, { color: theme.colors.textSecondary }]}>
            Used vouchers cannot be refunded or exchanged.
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
        {renderVoucherBalance()}
        {renderSearchAndFilter()}
        {renderVouchersList()}
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
  searchFilterContainer: {
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
  filterScroll: {
    marginBottom: 8,
  },
  filterContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  vouchersContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  vouchersList: {
    gap: 16,
    marginBottom: 24,
  },
  voucherItem: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voucherImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  voucherContent: {
    padding: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  voucherTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  voucherDetails: {
    gap: 8,
  },
  voucherValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  originalValue: {
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
  voucherMeta: {
    gap: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  voucherCode: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  minSpend: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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