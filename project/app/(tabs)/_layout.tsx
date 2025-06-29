import { Tabs } from 'expo-router';
import { Home, Newspaper, Trophy, User, Compass } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Platform } from 'react-native';

export default function TabLayout() {
  const theme = useTheme();
  console.log('🚨 TAB LAYOUT RENDERING - This should appear in console!');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundSecondary,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 84 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 15,
          paddingTop: 8,
          paddingHorizontal: 8,
          shadowColor: theme.colors.text,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-Medium',
          marginBottom: 3,
        },
        tabBarIconStyle: {
          marginTop: 3,
        },
        tabBarHideOnKeyboard: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => {
            console.log('🏠 Home icon rendering with color:', color);
            return (
              <Home 
                size={24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 1.8}
              />
            );
          },
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <Compass 
              size={24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, focused }) => (
            <Newspaper 
              size={24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Trophy 
              size={24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User 
              size={24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />
    </Tabs>
  );
}