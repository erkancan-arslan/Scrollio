/**
 * KidsMainTabNavigator - Bottom tab navigation for kids main screens.
 * Three tabs: Feed, Playground, Profile.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { fetchChildrenThunk } from '../features/kids/auth/store/authSlice';
import { childNeedsTopicOnboarding } from '../features/kids/shared/utils/childTopicOnboarding';

import { KidsFeedScreen } from '../features/kids/feed/screens/KidsFeedScreen';
import { KidsClassroomScreen } from '../features/kids/classroom/screens/KidsClassroomScreen';
import { KidsPlaygroundScreen } from '../features/kids/playground/screens/KidsPlaygroundScreen';
import { PlaygroundScreen } from '../features/playground/screens/PlaygroundScreen';
import { KidsProfileScreen } from '../features/kids/profile/screens/KidsProfileScreen';
import { KidsSettingsScreen } from '../features/kids/settings/screens/KidsSettingsScreen';

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
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const topicGateDone = useRef(false);

  useEffect(() => {
    if (topicGateDone.current) return;
    let cancelled = false;
    (async () => {
      try {
        await dispatch(fetchChildrenThunk()).unwrap();
      } catch {
        return;
      }
      if (cancelled) return;
      topicGateDone.current = true;
      const { childProfiles, activeChildProfileId } = store.getState().kidsAuth;
      const child = childProfiles.find((c) => c.id === activeChildProfileId);
      if (
        child &&
        child.selectedCharacterId &&
        childNeedsTopicOnboarding(child)
      ) {
        const parent = navigation.getParent();
        parent?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'KidsOnboardingTopics' }],
          }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigation]);

  return (
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
        component={KidsPlaygroundScreen}
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
