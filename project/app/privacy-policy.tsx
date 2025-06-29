import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <ChevronLeft size={28} color={theme.colors.text} onPress={() => router.back()} style={styles.backButton} /> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Privacy Policy</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Privacy Policy</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>This Privacy Policy describes how Champs collects, uses, and protects your personal information in accordance with the <Text style={{color: 'red'}}>Data Protection and Privacy Act, 2019 (Uganda)</Text> and other applicable laws.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Information We Collect</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We may collect personal information such as your <Text style={{color: 'red'}}>name, phone number, email address</Text>, device information, and usage data to provide and improve our services.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Use of Information</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Your information is used to operate the app, personalize your experience, communicate with you, and <Text style={{color: 'red'}}>comply with legal obligations</Text>.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Data Sharing</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We do <Text style={{color: 'red'}}>not sell your personal data</Text>. We may share information with Ugandan authorities as required by law or with trusted partners for service delivery, under strict confidentiality agreements.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Data Security</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We implement technical and organizational measures to <Text style={{color: 'red'}}>protect your data from unauthorized access, loss, or misuse</Text>, in line with Ugandan ICT standards.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Your Rights</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>You have the right to <Text style={{color: 'red'}}>access, correct, or delete your personal data</Text>, and to withdraw consent at any time. Contact us at <Text style={{color: 'red'}}>privacy@champs.com</Text> for requests.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Changes to This Policy</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We may update this policy. We will notify you of significant changes via the app or email.</Text>
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