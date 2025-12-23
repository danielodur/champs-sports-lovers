import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function LicenseCertificateScreen() {
  const router = useRouter();
  const theme = useTheme();

  const items = [
    { label: 'Business License', detail: 'Valid for mobile app operations in Uganda' },
    { label: 'Value Added Service License', detail: 'Issued by UCC for telecom services' },
    { label: 'Broadcasting License', detail: 'For digital content and streaming' },
    { label: 'URSB Registration', detail: 'Uganda Registration Services Bureau' },
    { label: 'UCC Compliance', detail: 'Uganda Communications Commission' },
    { label: 'NITA-U Registration', detail: 'National Information Tech Authority Uganda' },
    { label: 'Police Certificate', detail: 'Uganda Police Force Cybersecurity Compliance' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
          <ChevronLeft size={28} color={theme.colors.text} /> 
        </TouchableOpacity> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>License and Certificate</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listSection}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.listItem, { borderBottomColor: theme.colors.border }]}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.listLabel, { color: theme.colors.text }]}>{item.label}</Text>
                <Text style={[styles.listDetail, { color: theme.colors.textSecondary }]}>{item.detail}</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  listSection: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginHorizontal: 0,
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  listLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  listDetail: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
}); 