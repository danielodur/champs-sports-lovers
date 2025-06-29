import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  DollarSign,
  Banknote,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

type TransactionType = 'apple' | 'mobile-money' | 'bank-transfer';

interface TransactionDetail {
  transactionId: string;
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
  method: string;
  reference: string;
}

export default function RechargeIssuesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState<TransactionType>('apple');
  const [transactionCode, setTransactionCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<TransactionDetail | null>(null);

  const transactionTypes = [
    {
      id: 'apple' as TransactionType,
      label: 'Apple Pay',
      icon: CreditCard,
      description: 'iPhone & App Store',
      placeholder: 'Apple receipt code',
      color: '#DC2626',
    },
    {
      id: 'mobile-money' as TransactionType,
      label: 'Mobile Money',
      icon: Smartphone,
      description: 'MTN | Airtel Money',
      placeholder: 'Mobile Money code',
      color: '#EF4444',
    },
    {
      id: 'bank-transfer' as TransactionType,
      label: 'Bank Transfer',
      icon: Building,
      description: 'Bank Payment',
      placeholder: 'Bank reference code',
      color: '#F87171',
    },
  ];

  // Mock transaction data for demonstration
  const mockTransactionData: { [key: string]: TransactionDetail } = {
    'AP123456789': {
      transactionId: 'AP123456789',
      amount: 50000,
      date: '2024-01-15 14:30:25',
      status: 'failed',
      method: 'Apple Pay',
      reference: 'APP_REF_001234',
    },
    'MTN987654321': {
      transactionId: 'MTN987654321',
      amount: 25000,
      date: '2024-01-15 12:15:10',
      status: 'pending',
      method: 'MTN Mobile Money',
      reference: 'MTN_MM_567890',
    },
    'BNK555666777': {
      transactionId: 'BNK555666777',
      amount: 100000,
      date: '2024-01-14 16:45:30',
      status: 'success',
      method: 'Bank Transfer - Stanbic Bank',
      reference: 'STB_TXN_998877',
    },
  };

  const handleSearch = async () => {
    if (!transactionCode.trim()) {
      Alert.alert('Missing Code', 'Please enter your payment code first.');
      return;
    }

    if (transactionCode.trim().length < 8) {
      Alert.alert('Incomplete Code', 'Please enter a complete payment code (at least 8 characters).');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = mockTransactionData[transactionCode.toUpperCase()];
    if (result) {
      setSearchResult(result);
    } else {
      Alert.alert(
        'Payment Not Found',
        'We cannot find this payment code. Please check and try again, or call customer support for help.'
      );
    }

    setIsSearching(false);
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Get Help',
      'How do you want to contact us?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Us', onPress: () => console.log('Calling support...') },
        { text: 'Chat', onPress: () => console.log('Opening live chat...') },
        { text: 'Email', onPress: () => console.log('Opening email...') },
      ]
    );
  };

  const handleBackPress = () => {
    if (transactionCode.trim()) {
      Alert.alert(
        'Delete Code?',
        'The code will be deleted. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Delete', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'pending':
        return <Clock size={20} color="#FF9800" />;
      case 'failed':
        return <XCircle size={20} color="#F44336" />;
      default:
        return <AlertTriangle size={20} color="#9E9E9E" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatUGX = (amount: number): string => {
    return `UGX ${amount.toLocaleString('en-UG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderTransactionTypeSelector = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Select Payment Method
      </Text>
      <Text style={[styles.sectionSubtitle, { color: '#6B7280' }]}>
        Choose how you paid
      </Text>
      
      <View style={styles.typeSelector}>
        {transactionTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const opacity = isSelected ? 1 : 0.5;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeOption,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: isSelected ? type.color : '#E5E7EB',
                  borderWidth: isSelected ? 2 : 1,
                  opacity: opacity,
                },
              ]}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.typeIconContainer, 
                { 
                  backgroundColor: type.color,
                  opacity: isSelected ? 1 : 0.7,
                }
              ]}>
                <type.icon size={22} color="#FFFFFF" />
              </View>
              <View style={styles.typeContent}>
                <Text style={[
                  styles.typeLabel, 
                  { 
                    color: theme.colors.text,
                    opacity: isSelected ? 1 : 0.7,
                  }
                ]}>
                  {type.label}
                </Text>
                <Text style={[
                  styles.typeDescription, 
                  { 
                    color: '#6B7280',
                    opacity: isSelected ? 1 : 0.6,
                  }
                ]}>
                  {type.description}
                </Text>
              </View>
              {isSelected && (
                <CheckCircle size={20} color={type.color} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

    const renderSearchSection = () => {
    const selectedTypeData = transactionTypes.find(type => type.id === selectedType);
    const isCodeComplete = transactionCode.trim().length >= 8;
    const searchButtonColor = isCodeComplete ? '#DC2626' : '#9CA3AF';
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> 
          Enter Your Code
        </Text>
        <Text style={[styles.sectionSubtitle, { color: '#6B7280' }]}> 
          Type the payment code you received
        </Text>

        <View style={styles.searchContainer}> 
          <TextInput
            style={[styles.input, { backgroundColor: '#F3F4F6', color: theme.colors.text }]}
            placeholder={selectedTypeData?.placeholder}
            placeholderTextColor="#9CA3AF"
            value={transactionCode}
            onChangeText={setTransactionCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: searchButtonColor }]}
            onPress={handleSearch}
            disabled={isSearching || !isCodeComplete}
            activeOpacity={isCodeComplete ? 0.7 : 0.5}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.searchButtonText, { 
                color: isCodeComplete ? '#FFFFFF' : '#FFFFFF',
                opacity: isCodeComplete ? 1 : 0.8
              }]}>Start Search</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchResult = () => {
    if (!searchResult) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> 
          Payment Found
        </Text>
        
        <View style={[styles.resultCard, { backgroundColor: theme.colors.backgroundSecondary }]}> 
          <View style={styles.resultHeader}> 
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}> 
              {searchResult.method}
            </Text>
            <View style={styles.statusContainer}> 
              {getStatusIcon(searchResult.status)}
              <Text style={[styles.statusText, { color: getStatusColor(searchResult.status) }]}> 
                {searchResult.status.charAt(0).toUpperCase() + searchResult.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.resultDetails}> 
            <View style={styles.detailRow}> 
              <Text style={[styles.detailLabel, { color: '#6B7280' }]}> 
                Code:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}> 
                {searchResult.transactionId}
              </Text>
            </View>
            
            <View style={styles.detailRow}> 
              <Text style={[styles.detailLabel, { color: '#6B7280' }]}> 
                Money:
              </Text>
              <Text style={[styles.detailValue, { color: '#DC2626', fontWeight: 'bold' }]}> 
                {formatUGX(searchResult.amount)}
              </Text>
            </View>
            
            <View style={styles.detailRow}> 
              <Text style={[styles.detailLabel, { color: '#6B7280' }]}> 
                When:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}> 
                {searchResult.date}
              </Text>
            </View>
            
            <View style={styles.detailRow}> 
              <Text style={[styles.detailLabel, { color: '#6B7280' }]}> 
                Ref:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}> 
                {searchResult.reference}
              </Text>
            </View>
          </View>
          
          {searchResult.status === 'failed' && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: '#DC2626' }]}
              onPress={() => Alert.alert('Try Again', 'Do you want to pay again?')}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
          
          {searchResult.status === 'pending' && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: '#6B7280' }]}
              onPress={() => Alert.alert('Wait Please', 'Your payment is being checked. We will tell you soon.')}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Wait Please</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderImportantReminders = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.reminderHeader}>
        <AlertTriangle size={20} color="#DC2626" />
        <Text style={[styles.reminderTitle, { color: theme.colors.text }]}> 
          Important Tips
        </Text>
      </View>
      
      <View style={[styles.reminderCard, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <View style={styles.reminderItem}> 
          <Text style={[styles.reminderNumber, { color: '#DC2626' }]}>1.</Text> 
          <Text style={[styles.reminderText, { color: theme.colors.text }]}> 
            Keep your payment codes safe. Don't share with anyone.
          </Text>
        </View>
        
        <View style={styles.reminderItem}> 
          <Text style={[styles.reminderNumber, { color: '#DC2626' }]}>2.</Text> 
          <Text style={[styles.reminderText, { color: theme.colors.text }]}> 
            Mobile Money takes 5-10 minutes to complete.
          </Text>
        </View>
        
        <View style={styles.reminderItem}> 
          <Text style={[styles.reminderNumber, { color: '#DC2626' }]}>3.</Text> 
          <Text style={[styles.reminderText, { color: theme.colors.text }]}> 
            Bank payments take 1-2 hours during bank hours.
          </Text>
        </View>
        
        <View style={styles.reminderItem}> 
          <Text style={[styles.reminderNumber, { color: '#DC2626' }]}>4.</Text> 
          <Text style={[styles.reminderText, { color: theme.colors.text }]}> 
            Failed payments are returned in 3-5 days.
          </Text>
        </View>
        
        <View style={styles.reminderItem}> 
          <Text style={[styles.reminderNumber, { color: '#DC2626' }]}>5.</Text> 
          <Text style={[styles.reminderText, { color: theme.colors.text }]}> 
            Need help? Call{' '} 
            <Text style={[styles.supportLink, { color: '#DC2626' }]} onPress={handleContactSupport}> 
              Customer Support
            </Text>{' '} 
            anytime.
          </Text>
        </View>
      </View>
    </View>
  );

      return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      {/* Header */} 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={styles.backButton} 
          activeOpacity={0.7} 
        > 
          <ChevronLeft size={28} color={theme.colors.text} /> 
        </TouchableOpacity> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}> 
          Recharge Issues
        </Text> 
        <TouchableOpacity 
          style={styles.helpIconButton} 
          onPress={handleContactSupport} 
          activeOpacity={0.7} 
        > 
          <HelpCircle size={24} color="#DC2626" /> 
        </TouchableOpacity> 
      </View> 

      <KeyboardAvoidingView  
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} 
      > 
        <ScrollView  
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled" 
        > 
          <View style={styles.mainContent}> 
            {renderTransactionTypeSelector()} 
            {renderSearchSection()} 
            {renderSearchResult()} 
          </View> 
          
          <View style={styles.bottomTip}> 
            <Text style={[styles.tipText, { color: '#6B7280' }]}> 
              Keep your payment codes safe. Need help?{' '} 
              <Text  
                style={[styles.supportLinkText, { color: '#DC2626' }]}  
                onPress={handleContactSupport} 
              > 
                Contact Support Team
              </Text>{' '} 
              anytime.
            </Text> 
          </View> 
        </ScrollView> 
      </KeyboardAvoidingView> 
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
  headerRight: {
    width: 36,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  mainContent: {
    flex: 1,
  },
  sectionContainer: {
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
    marginBottom: 12,
    lineHeight: 18,
  },
  typeSelector: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  searchContainer: {
    gap: 12,
  },
  input: {
    width: '100%',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 0,
  },
  searchButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resultDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  reminderCard: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  reminderNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    width: 20,
  },
  reminderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 20,
  },
  supportLink: {
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
  },
  bottomTip: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  helpIconButton: {
    padding: 4,
  },
  supportLinkText: {
    fontFamily: 'Inter-SemiBold',
    textDecorationLine: 'underline',
  },
});