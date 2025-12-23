import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

export default function ContentPublishingStandardsScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <ChevronLeft size={28} color={theme.colors.text} onPress={() => router.back()} style={styles.backButton} /> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Publishing Standards</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Content Publishing Standards</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Champs is committed to upholding the <Text style={{color: 'red'}}>Uganda Communications Act, 2013</Text>, and other relevant laws. All content must be legal, respectful, and not infringe on the rights of others.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Prohibited Content</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>No <Text style={{color: 'red'}}>hate speech, violence, pornography, or illegal activities</Text>. Content must not violate Ugandan law or community standards.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Copyright and Ownership</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Only publish content you own or have rights to. <Text style={{color: 'red'}}>Respect copyright and intellectual property laws</Text>.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Reporting Violations</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>Report any content that violates these standards to <Text style={{color: 'red'}}>support@champs.com</Text>. We will investigate and take appropriate action.</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Enforcement</Text>
        <Text style={[styles.section, { color: theme.colors.textSecondary }]}>We reserve the right to <Text style={{color: 'red'}}>remove content and suspend users</Text> who breach these standards, in line with Ugandan law.</Text>
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