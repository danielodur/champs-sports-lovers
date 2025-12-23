import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Package, Target, Users, CreditCard, Gift } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function PurchaseRecordsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('sportwee-number');

  const tabs = [
    { id: 'sportwee-number', label: 'SportWee Number' },
    { id: 'prediction-number', label: 'Prediction Number' },
    { id: 'interactive-archive', label: 'Interactive Archive' },
    { id: 'payment-stickers', label: 'Payment Stickers' },
  ];

  const promotionalOffers = [
    {
      id: '1',
      title: 'Connect Supplement',
      subtitle: 'Settlement time judgment',
      description: 'SportWee number plan includes supplement',
      icon: Gift,
      color: '#FF6B6B',
    },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleOfferPress = (offerId: string) => {
    console.log(`Offer pressed: ${offerId}`);
    // Add navigation or action logic here
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sportwee-number':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/4439901/pexels-photo-4439901.jpeg' }}
                style={styles.emptyStateImage}
                resizeMode="contain"
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No data available
              </Text>
            </View>
          </View>
        );
      
      case 'prediction-number':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Target size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No prediction records
              </Text>
            </View>
          </View>
        );
      
      case 'interactive-archive':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <Users size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No interactive records
              </Text>
            </View>
          </View>
        );
      
      case 'payment-stickers':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <CreditCard size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                No payment records
              </Text>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderPromotionalOffers = () => (
    <View style={styles.promotionalSection}>
      {promotionalOffers.map((offer) => (
        <TouchableOpacity
          key={offer.id}
          style={[styles.promotionalCard, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => handleOfferPress(offer.id)}
          activeOpacity={0.8}
        >
          <View style={styles.promotionalContent}>
            <View style={[styles.promotionalIcon, { backgroundColor: offer.color }]}>
              <offer.icon size={24} color="#FFFFFF" />
            </View>
            <View style={styles.promotionalText}>
              <Text style={[styles.promotionalTitle, { color: theme.colors.text }]}>
                {offer.title}
              </Text>
              <Text style={[styles.promotionalSubtitle, { color: theme.colors.textSecondary }]}>
                ({offer.subtitle})
              </Text>
              <Text style={[styles.promotionalDescription, { color: theme.colors.textSecondary }]}>
                {offer.description}
              </Text>
            </View>
          </View>
          <View style={styles.promotionalIndicators}>
            {[...Array(5)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { 
                    backgroundColor: index === 0 ? theme.colors.primary : theme.colors.border,
                    borderColor: theme.colors.border
                  }
                ]}
              />
            ))}
          </View>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Purchase</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
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
                activeTab === tab.id && { borderBottomColor: theme.colors.primary }
              ]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
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
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        {renderPromotionalOffers()}
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
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    whiteSpace: 'nowrap',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    minHeight: 400,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  promotionalSection: {
    padding: 16,
  },
  promotionalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  promotionalContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promotionalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promotionalText: {
    flex: 1,
  },
  promotionalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  promotionalSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  promotionalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  promotionalIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});