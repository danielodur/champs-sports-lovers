import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function MinorPrivacyProtectionAgreementScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <ChevronLeft size={28} color={theme.colors.text} onPress={() => router.back()} style={styles.backButton} /> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Minor Privacy Protection</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Minor Privacy Protection Agreement</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>This agreement explains how Champs protects the privacy of minors, in line with the <Text style={{color: 'red'}}>Children Act (Cap. 59)</Text> and the <Text style={{color: 'red'}}>Data Protection and Privacy Act, 2019 (Uganda)</Text>.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Parental Consent</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We require <Text style={{color: 'red'}}>parental or guardian consent</Text> for users under 18. We do not knowingly collect data from minors without such consent.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Data Collection and Use</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Information from minors is used only to provide app services and is not shared with third parties except as required by law.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Rights of Minors</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Minors and their guardians may request <Text style={{color: 'red'}}>access, correction, or deletion of personal data</Text> at any time by contacting <Text style={{color: 'red'}}>privacy@champs.com</Text>.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Security Measures</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We use <Text style={{color: 'red'}}>strict security measures</Text> to protect minors' data, in compliance with Ugandan law.</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary, marginTop: 24 }]}>Effective Date: June 2024</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  headerRight: { width: 36 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontFamily: 'Inter-SemiBold', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', marginTop: 18, marginBottom: 4 },
  section: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 8 },
}); 