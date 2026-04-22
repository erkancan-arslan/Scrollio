/**
 * KidsMainTabNavigator - Bottom tab navigation for kids main screens.
 * Three tabs: Feed, Playground, Profile.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { KidsFeedScreen } from '../features/kids/feed/screens/KidsFeedScreen';
import { KidsClassroomScreen } from '../features/kids/classroom/screens/KidsClassroomScreen';
import { PlaygroundScreen } from '../features/playground/screens/PlaygroundScreen';
import { KidsProfileScreen } from '../features/kids/profile/screens/KidsProfileScreen';
import { KidsSettingsScreen } from '../features/kids/settings/screens/KidsSettingsScreen';
import { ScreenTimeGuard } from '../features/kids/parental/components/ScreenTimeGuard';

// ── Tab navigator ──

export type KidsMainTabParamList = {
  KidsFeed: undefined;
  KidsClassroom: undefined;
  KidsPlayground: { category?: string };
  KidsProfile: undefined;
  KidsSettings: undefined;
};

const Tab = createBottomTabNavigator<KidsMainTabParamList>();

const KIDS_ORANGE = '#FF6B35';

export const KidsMainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <ScreenTimeGuard>
      <Tab.Navigator
        screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + (Platform.OS === 'ios' ? insets.bottom : 10),
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          },
        ],
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="KidsFeed"
        component={KidsFeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="KidsClassroom"
        component={KidsClassroomScreen}
        options={{
          tabBarLabel: 'Classroom',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'school' : 'school-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="KidsPlayground"
        component={PlaygroundScreen}
        initialParams={{ category: 'kids' }}
        options={{
          tabBarLabel: 'Playground',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'game-controller' : 'game-controller-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="KidsProfile"
        component={KidsProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'happy' : 'happy-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="KidsSettings"
        component={KidsSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
    </ScreenTimeGuard>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: KIDS_ORANGE,
    borderTopWidth: 0,
    position: 'absolute',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
