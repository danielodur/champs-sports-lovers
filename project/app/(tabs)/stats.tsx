import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trophy, Users, Star, MapPin, Globe, Calendar, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { competitions, EnhancedCompetition } from '@/data/leagues';
import { useTranslation } from 'react-i18next';

// Competition type icons mapping
const getCompetitionTypeIcon = (type: string, tier: number) => {
  switch (type) {
    case 'international':
      return <Globe size={16} color="#FFD700" />;
    case 'continental':
      return tier === 1 ? <Trophy size={16} color="#FF6B35" /> : <Trophy size={16} color="#36A2EB" />;
    case 'cup':
      return <Trophy size={16} color="#8E44AD" />;
    case 'league':
      return <Users size={16} color="#2ECC71" />;
    default:
      return <Star size={16} color="#95A5A6" />;
  }
};

export default function StatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState('top');
  const [activeCategory, setActiveCategory] = useState('top');
  const [competitionType, setCompetitionType] = useState('all'); // all, league, cup, international, continental
  const [selectedCompetition, setSelectedCompetition] = useState<EnhancedCompetition | null>(null);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Enhanced regions with Oceania
  const regions = [
    { id: 'top', label: 'Top', icon: <Star size={14} color="#FFD700" /> },
    { id: 'international', label: 'International', icon: <Globe size={14} color="#3498DB" /> },
    { id: 'europe', label: 'Europe', icon: <MapPin size={14} color="#9B59B6" /> },
    { id: 'africa', label: 'Africa', icon: <MapPin size={14} color="#E67E22" /> },
    { id: 'asia', label: 'Asia', icon: <MapPin size={14} color="#E74C3C" /> },
    { id: 'america', label: 'America', icon: <MapPin size={14} color="#27AE60" /> },
    { id: 'oceania', label: 'Oceania', icon: <MapPin size={14} color="#3498DB" /> },
    { id: 'uganda', label: 'Uganda', icon: <MapPin size={14} color="#F1C40F" /> }
  ];

  // Competition type filters
  const competitionTypes = [
    { id: 'all', label: 'All', icon: <Globe size={14} color="#95A5A6" /> },
    { id: 'international', label: 'International', icon: <Globe size={14} color="#FFD700" /> },
    { id: 'continental', label: 'Continental', icon: <Trophy size={14} color="#FF6B35" /> },
    { id: 'league', label: 'Leagues', icon: <Users size={14} color="#2ECC71" /> },
    { id: 'cup', label: 'Cups', icon: <Trophy size={14} color="#8E44AD" /> }
  ];

  const getCompetitionsByCategory = (): EnhancedCompetition[] => {
    const footballCompetitions = competitions.football;
    
    let filteredCompetitions: EnhancedCompetition[] = [];

    // Filter by region/category
    switch (activeCategory.toLowerCase()) {
      case 'top':
        filteredCompetitions = footballCompetitions.filter(comp => 
          comp.tier === 1 && (
            comp.type === 'international' ||
            (comp.type === 'league' && ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'].includes(comp.name)) ||
            (comp.type === 'continental' && ['UEFA Champions League', 'Copa Libertadores', 'CAF Champions League'].includes(comp.name))
          )
        );
        break;
      
      case 'international':
        filteredCompetitions = footballCompetitions.filter(comp => 
          comp.type === 'international' || 
          (comp.type === 'continental' && comp.tier === 1)
        );
        break;
      
      case 'europe':
        filteredCompetitions = footballCompetitions.filter(comp => 
          ['England', 'Spain', 'Germany', 'Italy', 'France', 'Netherlands', 'Portugal', 'Belgium', 
           'Scotland', 'Switzerland', 'Austria', 'Greece', 'Turkey', 'Denmark', 'Sweden', 'Norway', 'Europe'].includes(comp.country)
        );
        break;
      
      case 'africa':
        filteredCompetitions = footballCompetitions.filter(comp => 
          ['Egypt', 'South Africa', 'Morocco', 'Tunisia', 'Algeria', 'Nigeria', 'Ghana', 
           'Senegal', 'Cameroon', 'Ivory Coast', 'DR Congo', 'Tanzania', 'Kenya', 'East Africa', 'Africa'].includes(comp.country)
        );
        break;
      
      case 'asia':
        filteredCompetitions = footballCompetitions.filter(comp => 
          ['Japan', 'South Korea', 'China', 'Saudi Arabia', 'Qatar', 'UAE', 'Iran', 
           'India', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Asia'].includes(comp.country)
        );
        break;
      
      case 'america':
        filteredCompetitions = footballCompetitions.filter(comp => 
          ['USA', 'Brazil', 'Argentina', 'Mexico', 'Colombia', 'Chile', 'Uruguay', 
           'Paraguay', 'Peru', 'Ecuador', 'Canada', 'South America', 'North America'].includes(comp.country)
        );
        break;
      
      case 'oceania':
        filteredCompetitions = footballCompetitions.filter(comp => 
          ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Oceania'].includes(comp.country)
        );
        break;
      
      case 'uganda':
        filteredCompetitions = footballCompetitions.filter(comp => 
          comp.country === 'Uganda' || comp.country === 'East Africa'
        );
        break;
      
      default:
        filteredCompetitions = [];
    }

    // Filter by competition type
    if (competitionType !== 'all') {
      filteredCompetitions = filteredCompetitions.filter(comp => comp.type === competitionType);
    }

    // Sort by tier and name
    return filteredCompetitions.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });
  };

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'International': 'un',
      'Europe': 'eu',
      'Asia': 'un',
      'Africa': 'un',
      'North America': 'us',
      'South America': 'br',
      'Oceania': 'au',
      'East Africa': 'ug',
      'Multiple': 'un',
      'USA': 'us',
      'UAE': 'ae',
      'UK': 'gb',
      'England': 'gb-eng',
      'Scotland': 'gb-sct',
      'Wales': 'gb-wls',
      'DR Congo': 'cd',
      'South Korea': 'kr',
      'North Korea': 'kp',
      'Ivory Coast': 'ci',
      'Cape Verde': 'cv',
      'East Timor': 'tl',
      'Laos': 'la',
      'Myanmar': 'mm',
      'Syria': 'sy',
      'Vietnam': 'vn',
      'Uganda': 'ug',
      'Tanzania': 'tz',
      'Kenya': 'ke',
      'Nigeria': 'ng',
      'Ghana': 'gh',
      'Senegal': 'sn',
      'Cameroon': 'cm',
      'Egypt': 'eg',
      'Morocco': 'ma',
      'Tunisia': 'tn',
      'Algeria': 'dz',
      'South Africa': 'za',
      'Spain': 'es',
      'Germany': 'de',
      'Italy': 'it',
      'France': 'fr',
      'Netherlands': 'nl',
      'Portugal': 'pt',
      'Belgium': 'be',
      'Switzerland': 'ch',
      'Austria': 'at',
      'Greece': 'gr',
      'Turkey': 'tr',
      'Denmark': 'dk',
      'Sweden': 'se',
      'Norway': 'no',
      'Brazil': 'br',
      'Argentina': 'ar',
      'Mexico': 'mx',
      'Colombia': 'co',
      'Chile': 'cl',
      'Uruguay': 'uy',
      'Paraguay': 'py',
      'Peru': 'pe',
      'Ecuador': 'ec',
      'Canada': 'ca',
      'Japan': 'jp',
      'China': 'cn',
      'Saudi Arabia': 'sa',
      'Qatar': 'qa',
      'Iran': 'ir',
      'Australia': 'au',
      'New Zealand': 'nz',
      'India': 'in',
      'Thailand': 'th',
      'Indonesia': 'id',
      'Malaysia': 'my',
      'Singapore': 'sg',
      'Philippines': 'ph'
    };

    const code = flagMap[country] || country.toLowerCase().replace(/\s+/g, '-');
    return `https://flagcdn.com/w80/${code}.png`;
  };

  const handleCompetitionPress = (competition: EnhancedCompetition) => {
    console.log(`📊 Opening competition: ${competition.name}`);
    // Navigate to competition details screen
    router.push(`/competition-details?id=${competition.id}&name=${encodeURIComponent(competition.name)}`);
  };

  const getCompetitionLogo = (competition: EnhancedCompetition) => {
    if (competition.logo) {
      return competition.logo;
    }
    // Fallback to country flag
    return getCountryFlag(competition.country);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'international': return 'International';
      case 'continental': return 'Continental';
      case 'league': return 'League';
      case 'cup': return 'Cup';
      default: return 'Competition';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Tier 1';
      case 2: return 'Tier 2';
      case 3: return 'Tier 3';
      default: return `Tier ${tier}`;
    }
  };

  const competitionsList = getCompetitionsByCategory();

  return (
    <>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} translucent />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Enhanced Header */}
        <View style={[
          styles.headerBackground, 
          { 
            backgroundColor: theme.colors.backgroundSecondary,
            shadowColor: theme.colors.background === '#FFFFFF' ? '#000000' : '#000000',
          }
        ]}>
          <SafeAreaView edges={['top']} />
          
          <View style={styles.headerWrapper}>
            {/* Region Categories */}
            <View style={[styles.header, { backgroundColor: 'transparent' }]}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                <View style={styles.categoryContainer}>
                  {regions.map((region) => (
                    <TouchableOpacity
                      key={region.id}
                      style={[
                        styles.categoryButton,
                        { backgroundColor: theme.colors.backgroundSecondary },
                        activeCategory === region.id && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => setActiveCategory(region.id)}
                    >
                      {region.icon}
                      <Text style={[
                        styles.categoryText,
                        { color: theme.colors.textSecondary },
                        activeCategory === region.id && { color: '#FFFFFF' }
                      ]}>
                        {region.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Competition Type Filters */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={[styles.typeFilterScroll, { marginTop: 8 }]}
            >
              <View style={styles.typeFilterContainer}>
                {competitionTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeFilterButton,
                      { borderColor: theme.colors.border },
                      competitionType === type.id && { 
                        backgroundColor: theme.colors.primary, 
                        borderColor: theme.colors.primary 
                      }
                    ]}
                    onPress={() => setCompetitionType(type.id)}
                  >
                    {type.icon}
                    <Text style={[
                      styles.typeFilterText,
                      { color: theme.colors.textSecondary },
                      competitionType === type.id && { color: '#FFFFFF' }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Enhanced Content */}
        <View style={styles.content}>
          {/* Left Menu */}
          <View style={[styles.leftMenuContainer, { backgroundColor: theme.colors.background }]}>
            <ScrollView>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={[
                    styles.regionButton,
                    activeRegion === region.id && { backgroundColor: theme.colors.backgroundSecondary }
                  ]}
                  onPress={() => {
                    setActiveRegion(region.id);
                    setActiveCategory(region.id);
                  }}
                >
                  <View style={styles.regionButtonContent}>
                    {region.icon}
                    <Text 
                      style={[
                        styles.regionText,
                        { color: theme.colors.textSecondary },
                        activeRegion === region.id && { color: theme.colors.text, fontWeight: '600' }
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {region.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Enhanced Competition List */}
          <ScrollView style={[styles.competitionList, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Loading competitions...
                </Text>
              </View>
            ) : (
              <>
                {/* Competition Count */}
                <View style={styles.countContainer}>
                  <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
                    {competitionsList.length} competitions found
                  </Text>
                </View>

                {/* Competition Items */}
                {competitionsList.map((competition) => (
                  <TouchableOpacity
                    key={competition.id}
                    style={[styles.competitionItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => handleCompetitionPress(competition)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.competitionImageContainer}>
                      <Image
                        source={{ uri: getCompetitionLogo(competition) }}
                        style={styles.competitionLogo}
                        resizeMode="contain"
                      />
                      <View style={styles.tierBadge}>
                        <Text style={styles.tierText}>{competition.tier}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.competitionInfo}>
                      <View style={styles.competitionHeader}>
                        <Text style={[styles.competitionName, { color: theme.colors.text }]} numberOfLines={1}>
                          {competition.name}
                        </Text>
                        {getCompetitionTypeIcon(competition.type, competition.tier)}
                      </View>
                      
                      <View style={styles.competitionMeta}>
                        <Text style={[styles.countryName, { color: theme.colors.textSecondary }]}>
                          {competition.country}
                        </Text>
                        <Text style={[styles.typeLabel, { color: theme.colors.primary }]}>
                          {getTypeLabel(competition.type)}
                        </Text>
                      </View>
                      
                      <View style={styles.competitionDetails}>
                        <Text style={[styles.participantCount, { color: theme.colors.textSecondary }]}>
                          {competition.participantCount} teams
                        </Text>
                        <Text style={[styles.currentSeason, { color: theme.colors.textSecondary }]}>
                          {competition.currentSeason}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>

        {/* Competition Detail Modal */}
        <Modal
          visible={showCompetitionModal}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setShowCompetitionModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <SafeAreaView edges={['top']} />
            
            {selectedCompetition && (
              <>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.modalHeaderContent}>
                    <Image
                      source={{ uri: getCompetitionLogo(selectedCompetition) }}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                    <View style={styles.modalTitleContainer}>
                      <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                        {selectedCompetition.name}
                      </Text>
                      <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                        {selectedCompetition.country} • {getTypeLabel(selectedCompetition.type)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                    onPress={() => setShowCompetitionModal(false)}
                  >
                    <X size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <ScrollView style={styles.modalContent}>
                  <View style={styles.competitionStatsContainer}>
                    <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <Users size={20} color={theme.colors.primary} />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {selectedCompetition.participantCount}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Teams
                      </Text>
                    </View>
                    
                    <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <Calendar size={20} color={theme.colors.primary} />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {selectedCompetition.currentSeason}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Season
                      </Text>
                    </View>
                    
                    <View style={[styles.statItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                      <Trophy size={20} color={theme.colors.primary} />
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {getTierLabel(selectedCompetition.tier)}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Tier
                      </Text>
                    </View>
                  </View>

                  {/* Competition Actions */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => {
                        setShowCompetitionModal(false);
                        router.push(`/competition-details?id=${selectedCompetition.id}&name=${encodeURIComponent(selectedCompetition.name)}&tab=standings`);
                      }}
                    >
                      <Trophy size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>View Standings</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                      onPress={() => {
                        setShowCompetitionModal(false);
                        router.push(`/competition-details?id=${selectedCompetition.id}&name=${encodeURIComponent(selectedCompetition.name)}&tab=fixtures`);
                      }}
                    >
                      <Calendar size={20} color={theme.colors.text} />
                      <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>View Fixtures</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerBackground: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  headerWrapper: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  header: {
    paddingVertical: 8,
  },
  categoryScroll: {
    paddingHorizontal: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  typeFilterScroll: {
    paddingHorizontal: 12,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  typeFilterText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftMenuContainer: {
    width: 120,
  },
  regionButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  regionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regionText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'left',
    flex: 1,
  },
  competitionList: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  countContainer: {
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  competitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  competitionImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  competitionLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  tierBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  competitionInfo: {
    flex: 1,
  },
  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  competitionName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  competitionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  countryName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
  },
  competitionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantCount: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  currentSeason: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  competitionStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionButtonsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});