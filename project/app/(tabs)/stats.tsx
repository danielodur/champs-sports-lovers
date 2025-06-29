import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { leagues } from '@/data/leagues';
import { useTranslation } from 'react-i18next';

export default function StatsScreen() {
  const theme = useTheme();
  const [activeRegion, setActiveRegion] = useState('top');
  const [activeCategory, setActiveCategory] = useState('top');
  const { t } = useTranslation();

  // Function to truncate text to 11 characters with ellipsis
  const truncateText = (text: string, maxLength: number = 11): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  const regions = [
    { id: 'top', label: t('Top') },
    { id: 'international', label: t('International') },
    { id: 'europe', label: t('Europe') },
    { id: 'uganda', label: t('Uganda') },
    { id: 'africa', label: t('Africa') },
    { id: 'america', label: t('America') },
    { id: 'asia', label: t('Asia') }
  ];

  const getLeaguesByCategory = () => {
    const sportLeagues = leagues.football;
    
    switch (activeCategory.toLowerCase()) {
      case 'top':
        return sportLeagues.filter(league => 
          ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Eredivisie', 'Primeira Liga', 'Belgian Pro League'].includes(league.name)
        );
      
      case 'international':
        return sportLeagues.filter(league => 
          league.country === 'International' || league.country === 'Europe' || 
          league.country === 'Asia' || league.country === 'Africa' || 
          league.country === 'North America' || league.country === 'South America'
        );
      
      case 'europe':
        return sportLeagues.filter(league => 
          ['England', 'Spain', 'Germany', 'Italy', 'France', 'Netherlands', 'Portugal', 'Belgium', 
           'Scotland', 'Switzerland', 'Austria', 'Greece', 'Turkey', 'Denmark', 'Sweden', 'Norway'].includes(league.country)
        );
      
      case 'uganda':
        return sportLeagues.filter(league => league.country === 'Uganda');
      
      case 'africa':
        return sportLeagues.filter(league => 
          ['Egypt', 'South Africa', 'Morocco', 'Tunisia', 'Algeria', 'Nigeria', 'Ghana', 
           'Senegal', 'Cameroon', 'Ivory Coast', 'DR Congo', 'Tanzania'].includes(league.country)
        );
      
      case 'america':
        return sportLeagues.filter(league => 
          ['USA', 'Brazil', 'Argentina', 'Mexico', 'Colombia', 'Chile', 'Uruguay', 
           'Paraguay', 'Peru', 'Ecuador', 'Canada'].includes(league.country)
        );
      
      case 'asia':
        return sportLeagues.filter(league => 
          ['Japan', 'South Korea', 'China', 'Saudi Arabia', 'Qatar', 'UAE', 'Iran', 
           'Australia', 'India', 'Thailand', 'Vietnam', 'Indonesia'].includes(league.country)
        );
      
      default:
        return [];
    }
  };

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'International': 'un',
      'Europe': 'eu',
      'Asia': 'un',
      'Africa': 'un',
      'North America': 'un',
      'South America': 'un',
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

  return (
    <>
      <StatusBar barStyle={theme.colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} backgroundColor={theme.colors.backgroundSecondary} translucent />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Grey header background that extends from top */}
        <View style={[
          styles.headerBackground, 
          { 
            backgroundColor: theme.colors.backgroundSecondary,
            shadowColor: theme.colors.background === '#FFFFFF' ? '#000000' : '#000000',
          }
        ]}>
          {/* Safe area for status bar */}
          <SafeAreaView edges={['top']} />
          
          {/* Header content */}
          <View style={styles.headerWrapper}>
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
                      <Text style={[
                        styles.categoryText,
                        { color: theme.colors.textSecondary },
                        activeCategory === region.id && { color: theme.colors.text }
                      ]}>
                        {region.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.content}>
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
                  <Text 
                    style={[
                      styles.regionText,
                      { color: theme.colors.textSecondary },
                      activeRegion === region.id && { color: theme.colors.text }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {truncateText(region.label)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={[styles.leagueList, { backgroundColor: theme.colors.backgroundSecondary }]}>
            {getLeaguesByCategory().map((league) => (
              <TouchableOpacity
                key={league.id}
                style={[styles.leagueItem, { borderBottomColor: theme.colors.border }]}
              >
                <Image
                  source={{ uri: getCountryFlag(league.country) }}
                  style={styles.leagueFlag}
                  resizeMode="cover"
                />
                <View style={styles.leagueInfo}>
                  <Text style={[styles.leagueName, { color: theme.colors.text }]}>{league.name}</Text>
                  <Text style={[styles.countryName, { color: theme.colors.textSecondary }]}>{league.country}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftMenuContainer: {
    width: 110,
  },
  regionButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  regionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'left',
  },
  leagueList: {
    flex: 1,
    padding: 12,
  },
  leagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  leagueFlag: {
    width: 32,
    height: 24,
    marginRight: 12,
    borderRadius: 4,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  countryName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});