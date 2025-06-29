import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Grid2X2, Plus } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MoreFeaturesButton() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const handlePress = () => {
    router.push('/more-features');
  };

  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name="apps" size={36} color={theme.colors.text} />
      <Text style={[styles.menuLabel, { color: theme.colors.textSecondary, textAlign: 'center', paddingLeft: 4 }]}> 
        {t('More Features')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  menuLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
});