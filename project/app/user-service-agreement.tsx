import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export default function UserServiceAgreementScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <ChevronLeft size={28} color={theme.colors.text} onPress={() => router.back()} style={styles.backButton} /> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>User Service Agreement</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>User Service Agreement</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>This agreement outlines the terms and conditions for using Champs, in accordance with the <Text style={{color: 'red'}}>Electronic Transactions Act, 2011 (Uganda)</Text> and other relevant laws.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>By using this app, you agree to comply with all applicable <Text style={{color: 'red'}}>Ugandan laws</Text> and these terms.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. User Responsibilities</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>You agree to provide <Text style={{color: 'red'}}>accurate information</Text>, respect other users, and not misuse the app for unlawful purposes.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Service Availability</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We strive to provide reliable service but do not guarantee <Text style={{color: 'red'}}>uninterrupted access</Text>. We may update or suspend features as needed.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Intellectual Property</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>All content and trademarks are owned by Champs or its licensors. <Text style={{color: 'red'}}>Unauthorized use is prohibited</Text>.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Limitation of Liability</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Champs is not liable for indirect damages or losses arising from app use, except as required by <Text style={{color: 'red'}}>Ugandan law</Text>.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Dispute Resolution</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Disputes will be resolved under <Text style={{color: 'red'}}>Ugandan law</Text>. Contact <Text style={{color: 'red'}}>support@champs.com</Text> for issues.</Text>
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