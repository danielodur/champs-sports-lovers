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
import { 
  ChevronLeft, 
  Send, 
  Download, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CircleCheck as CheckCircle, 
  Circle as XCircle, 
  CircleAlert as AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  MessageCircle
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'topup';
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  recipient?: string;
  sender?: string;
  description: string;
  reference: string;
}

type FilterType = 'all' | 'sent' | 'received' | 'topup' | 'pending' | 'completed' | 'failed';

export default function MyWalletScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0.00);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'topup',
      amount: 50000,
      date: new Date('2024-01-15T10:30:00'),
      status: 'completed',
      description: 'Wallet Top-up via Mobile Money',
      reference: 'TXN001234567'
    },
    {
      id: '2',
      type: 'sent',
      amount: 15000,
      date: new Date('2024-01-14T15:45:00'),
      status: 'completed',
      recipient: 'John Mukasa',
      description: 'Payment for services',
      reference: 'TXN001234568'
    },
    {
      id: '3',
      type: 'received',
      amount: 25000,
      date: new Date('2024-01-13T09:15:00'),
      status: 'pending',
      sender: 'Sarah Nakato',
      description: 'Refund payment',
      reference: 'TXN001234569'
    }
  ];

  const filterOptions: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('All') },
    { id: 'topup', label: t('Top-ups') },
    { id: 'sent', label: t('Sent') },
    { id: 'received', label: t('Received') },
    { id: 'pending', label: t('Pending') },
    { id: 'completed', label: t('Completed') },
    { id: 'failed', label: t('Failed') }
  ];

  React.useEffect(() => {
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
  }, []);

  React.useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, activeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(query) ||
        tx.recipient?.toLowerCase().includes(query) ||
        tx.sender?.toLowerCase().includes(query) ||
        tx.reference.toLowerCase().includes(query)
      );
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(tx => {
        switch (activeFilter) {
          case 'sent':
          case 'received':
          case 'topup':
            return tx.type === activeFilter;
          case 'pending':
          case 'completed':
          case 'failed':
            return tx.status === activeFilter;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    setFilteredTransactions(filtered);
  };

  const formatUGX = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-UG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'pending':
        return <Clock size={16} color="#FF9800" />;
      case 'failed':
        return <XCircle size={16} color="#F44336" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight size={24} color="#F44336" />;
      case 'received':
        return <ArrowDownLeft size={24} color="#4CAF50" />;
      case 'topup':
        return <Download size={24} color="#2196F3" />;
      default:
        return <AlertCircle size={24} color="#9E9E9E" />;
    }
  };

  const handleTopUp = () => {
    Alert.alert(
      t('Top Up Wallet'),
      t('Choose your top-up method') + '\n\n• ' + t('Mobile Money (MTN, Airtel)') + '\n• ' + t('Bank Transfer') + '\n• ' + t('Credit/Debit Card'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Mobile Money'), onPress: () => console.log('Mobile Money selected') },
        { text: t('Bank Transfer'), onPress: () => console.log('Bank Transfer selected') }
      ]
    );
  };

  const handleSend = () => {
    Alert.alert(
      'Send Money',
      'Send money feature will be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const handleReceive = () => {
    Alert.alert(
      'Receive Money',
      'Receive money feature will be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const handleCustomerService = () => {
    Alert.alert(
      'Customer Service',
      'Contact our customer service team for assistance with your wallet.',
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Wallet</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderBalanceCard = () => (
    <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <TouchableOpacity 
          onPress={() => setBalanceVisible(!balanceVisible)}
          style={styles.visibilityButton}
          activeOpacity={0.7}
        >
          {balanceVisible ? (
            <Eye size={20} color="#FFFFFF" />
          ) : (
            <EyeOff size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.balanceAmount}>
        {balanceVisible ? formatUGX(balance) : '••••••••'}
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={handleTopUp}
          activeOpacity={0.8}
        >
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Top Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Send size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={handleReceive}
          activeOpacity={0.8}
        >
          <ArrowDownLeft size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
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
            { color: theme.colors.text },
            ...(Platform.OS === 'web' ? [{ outlineStyle: 'none' } as any] : [])
          ]}
          placeholder={t('Search transactions...')}
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

  const renderTransactionItem = (transaction: Transaction) => (
    <TouchableOpacity
      key={transaction.id}
      style={[styles.transactionItem, { backgroundColor: theme.colors.backgroundSecondary }]}
      activeOpacity={0.7}
    >
      <View style={styles.transactionIcon}>
        {getTransactionIcon(transaction.type)}
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>
            {transaction.description}
          </Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(transaction.status)}
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.transactionMeta}>
          <Text style={[styles.transactionContact, { color: theme.colors.textSecondary }]}>
            {transaction.type === 'sent' ? `To: ${transaction.recipient}` : 
             transaction.type === 'received' ? `From: ${transaction.sender}` : 
             'Wallet Top-up'}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
            {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <View style={styles.transactionAmounts}>
          <Text style={[styles.ugxAmount, { color: theme.colors.text }]}>
            {transaction.type === 'sent' ? '-' : '+'}{formatUGX(transaction.amount)}
          </Text>
          <Text style={[styles.referenceText, { color: theme.colors.textSecondary }]}>
            Ref: {transaction.reference}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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

  const renderTransactionsList = () => (
    <View style={styles.transactionsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Transaction History ({filteredTransactions.length})
      </Text>
      
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            {searchQuery || activeFilter !== 'all' ? 'No transactions match your search' : 'No transactions yet'}
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            {searchQuery || activeFilter !== 'all' ? 'Try adjusting your search or filters' : 'Your transaction history will appear here'}
          </Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {filteredTransactions.map(renderTransactionItem)}
        </View>
      )}
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
        {renderBalanceCard()}
        {renderSearchAndFilter()}
        {renderTransactionsList()}
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
  visibilityButton: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
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
  transactionsContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
    marginBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
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
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 8,
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
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionContact: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  ugxAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  referenceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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