import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Trophy, Mail, Globe, FileText, LucideIcon } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';

type ContactItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type LegalItem = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

type Section = {
  title: string;
  content?: string;
  items?: (ContactItem | LegalItem)[];
};

export default function AboutUsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [showVersionModal, setShowVersionModal] = React.useState(false);
  const { t } = useTranslation();

  const sections: Section[] = [
    {
      title: t('About SportWee'),
      content: t('SportWee is a comprehensive sports platform that provides live match updates, predictions, and community features for sports enthusiasts.'),
    },
    {
      title: t('Our Mission'),
      content: t('To provide sports fans with an engaging and interactive platform where they can follow their favorite sports, make predictions, and connect with other fans.'),
    },
    {
      title: t('Contact Us'),
      items: [
        { icon: Mail, label: t('Email'), value: 'support@sportwee.com' },
        { icon: Globe, label: t('Website'), value: 'www.sportwee.com' },
      ],
    },
    {
      title: t('Legal'),
      items: [
        { icon: FileText, label: t('Privacy Policy'), onPress: () => router.push('/privacy-policy') },
        { icon: FileText, label: t('Terms of Service'), onPress: () => router.push('/user-service-agreement') },
      ],
    },
  ];

  const handleItemPress = (item: any) => {
    if (item.label === 'Version Update') {
      setShowVersionModal(true);
    } else if (item.route) {
      router.push(item.route);
    }
  };

  const renderItem = (item: ContactItem | LegalItem) => {
    if ('value' in item) {
      return (
        <TouchableOpacity
          style={[styles.item, { borderBottomColor: theme.colors.border }]}
        >
          <View style={styles.itemLeft}>
            <item.icon size={20} color={theme.colors.text} />
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
              {item.label}
            </Text>
          </View>
          <Text style={[styles.itemValue, { color: theme.colors.textSecondary }]}>
            {item.value}
          </Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={[styles.item, { borderBottomColor: theme.colors.border }]}
          onPress={item.onPress}
        >
          <View style={styles.itemLeft}>
            <item.icon size={20} color={theme.colors.text} />
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
              {item.label}
            </Text>
          </View>
          <ChevronLeft size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
          <ChevronLeft size={28} color={theme.colors.text} /> 
        </TouchableOpacity> 
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('About Us')}</Text> 
        <View style={styles.headerRight} /> 
      </View> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Trophy size={64} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: theme.colors.text }]}>{t('Champs')}</Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>V1.0.0</Text>
        </View>
        <View style={styles.listSection}>
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {section.title}
              </Text>
              {section.content ? (
                <Text style={[styles.sectionContent, { color: theme.colors.textSecondary }]}>
                  {section.content}
                </Text>
              ) : (
                <View style={[styles.itemsContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  {section.items?.map((item, itemIndex) => (
                    <React.Fragment key={itemIndex}>
                      {renderItem(item)}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: theme.colors.textSecondary }]}>Copyright © 2024 Champs. ALL Rights Reserved</Text>
        </View>
      </ScrollView>
      {/* Version Update Modal */}
      <Modal
        visible={showVersionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVersionModal(false)}
      >
        <View style={styles.versionModalOverlay}>
          <View style={[styles.versionModalContainer, { backgroundColor: theme.colors.backgroundSecondary }]}> 
            <Text style={[styles.versionModalTitle, { color: theme.colors.text }]}>{t('You\'re up to date!')}</Text>
            <Text style={[styles.versionModalText, { color: theme.colors.textSecondary }]}>{t('You are already using the latest version of Champs.')}</Text>
            <TouchableOpacity
              style={[styles.versionModalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowVersionModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.versionModalButtonText}>{t('OK')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  version: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  listSection: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginHorizontal: 0,
    marginBottom: 24,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  itemsContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  itemValue: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  versionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionModalContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  versionModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  versionModalText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginBottom: 28,
    textAlign: 'center',
  },
  versionModalButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
    alignItems: 'center',
  },
  versionModalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
}); 