import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, UserX, Share2, Search } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [profileVisible, setProfileVisible] = useState(true);
  const [searchable, setSearchable] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
          <ChevronLeft size={28} color={theme.colors.text} /> 
        </TouchableOpacity> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Privacy Settings</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy Controls</Text>
          <View style={[styles.settingRow, { backgroundColor: theme.colors.backgroundSecondary }]}> 
            <View style={styles.settingLeft}>
              <Eye size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Profile Visibility</Text>
            </View>
            <Switch
              value={profileVisible}
              onValueChange={setProfileVisible}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
          <View style={[styles.settingRow, { backgroundColor: theme.colors.backgroundSecondary }]}> 
            <View style={styles.settingLeft}>
              <Search size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Allow others to find me by search</Text>
            </View>
            <Switch
              value={searchable}
              onValueChange={setSearchable}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
          <View style={[styles.settingRow, { backgroundColor: theme.colors.backgroundSecondary }]}> 
            <View style={styles.settingLeft}>
              <Share2 size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Allow data sharing for analytics</Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Blocked Users</Text>
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: theme.colors.backgroundSecondary, justifyContent: 'space-between' }]}
            onPress={() => router.push('/blocked-users')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <UserX size={20} color={theme.colors.text} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Manage Blocked Users</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 14,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flexShrink: 1,
  },
});
