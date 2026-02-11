/**
 * KidsNavigator - Complete gated navigation for the Kids module.
 *
 * Gate flow (conditional rendering based on Redux state):
 *   1. No session → AuthStack (login / register)
 *   2. Role not parent/school → RoleBlockedScreen
 *   3. PIN not set → SetPinScreen
 *   4. PIN not verified → PinEntryScreen
 *   5. No children → CreateChildScreen
 *   6. No active child → ChildSelectorScreen
 *   7. → MainTabs (feed, playground, profile) + Parental stack
 *
 * All screens are always registered; gating is achieved via initialRouteName
 * and imperative navigation from each gate screen.
 */

import React, { useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { UserRole } from '../features/kids/shared/types';

// Auth screens
import { KidsLoginScreen } from '../features/kids/auth/screens/LoginScreen';
import { KidsRegisterScreen } from '../features/kids/auth/screens/RegisterScreen';
import { KidsSetPinScreen } from '../features/kids/auth/screens/SetPinScreen';
import { KidsPinEntryScreen } from '../features/kids/auth/screens/PinEntryScreen';
import { KidsChildSelectorScreen } from '../features/kids/auth/screens/ChildSelectorScreen';
import { KidsCreateChildScreen } from '../features/kids/auth/screens/CreateChildScreen';
import { KidsRoleBlockedScreen } from '../features/kids/auth/screens/RoleBlockedScreen';

// Main tabs
import { KidsMainTabNavigator, KidsMainTabParamList } from './KidsMainTabNavigator';

// Parental screens
import { KidsParentalDashboardScreen } from '../features/kids/parental/screens/KidsParentalDashboardScreen';
import { KidsActivityMonitorScreen } from '../features/kids/parental/screens/KidsActivityMonitorScreen';
import { KidsScreenTimeScreen } from '../features/kids/parental/screens/KidsScreenTimeScreen';
import { KidsContentSafetyScreen } from '../features/kids/parental/screens/KidsContentSafetyScreen';

// ── Type definitions ──

export type KidsStackParamList = {
  // Auth
  KidsLogin: undefined;
  KidsRegister: undefined;
  KidsRoleBlocked: undefined;

  // PIN
  KidsPinEntry: undefined;
  KidsSetPin: undefined;

  // Child selection
  KidsChildSelector: undefined;
  KidsCreateChild: undefined;

  // Main app
  KidsMainTabs: NavigatorScreenParams<KidsMainTabParamList>;

  // Parental
  KidsParentalDashboard: undefined;
  KidsParentalActivity: undefined;
  KidsScreenTime: undefined;
  KidsContentSafety: undefined;
};

const Stack = createStackNavigator<KidsStackParamList>();

const KIDS_BG = '#FFF8F0';
const KIDS_ORANGE = '#FF6B35';

export const KidsNavigator: React.FC = () => {
  // Compute initialRouteName only ONCE on first mount.
  // All subsequent navigation is handled explicitly via CommonActions.reset
  // from each gate screen (Login, Register, SetPin, PinEntry, etc.).
  const initialRouteRef = useRef<keyof KidsStackParamList | null>(null);

  const {
    session,
    userRole,
    isPinSet,
    isPinVerified,
    childProfiles,
    activeChildProfileId,
  } = useAppSelector((s) => s.kidsAuth);

  if (initialRouteRef.current === null) {
    const isLoggedIn = !!session;
    const isParentOrSchool =
      userRole === UserRole.PARENT || userRole === UserRole.SCHOOL;

    let route: keyof KidsStackParamList = 'KidsLogin';
    if (isLoggedIn) {
      if (!isParentOrSchool) {
        route = 'KidsRoleBlocked';
      } else if (!isPinSet) {
        route = 'KidsSetPin';
      } else if (!isPinVerified) {
        route = 'KidsPinEntry';
      } else if (childProfiles.length === 0) {
        route = 'KidsCreateChild';
      } else if (!activeChildProfileId) {
        route = 'KidsChildSelector';
      } else {
        route = 'KidsMainTabs';
      }
    }
    initialRouteRef.current = route;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteRef.current}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth screens */}
      <Stack.Screen name="KidsLogin" component={KidsLoginScreen} />
      <Stack.Screen name="KidsRegister" component={KidsRegisterScreen} />
      <Stack.Screen
        name="KidsRoleBlocked"
        component={KidsRoleBlockedScreen}
        options={{ gestureEnabled: false }}
      />

      {/* PIN screens */}
      <Stack.Screen
        name="KidsSetPin"
        component={KidsSetPinScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="KidsPinEntry"
        component={KidsPinEntryScreen}
        options={{ gestureEnabled: false }}
      />

      {/* Child management */}
      <Stack.Screen name="KidsChildSelector" component={KidsChildSelectorScreen} />
      <Stack.Screen
        name="KidsCreateChild"
        component={KidsCreateChildScreen}
        options={{
          headerShown: true,
          headerTitle: 'New Child Profile',
          headerTintColor: KIDS_ORANGE,
        }}
      />

      {/* Main tabs */}
      <Stack.Screen
        name="KidsMainTabs"
        component={KidsMainTabNavigator}
        options={{ gestureEnabled: false }}
      />

      {/* Parental screens */}
      <Stack.Screen
        name="KidsParentalDashboard"
        component={KidsParentalDashboardScreen}
        options={{
          headerShown: true,
          headerTitle: 'Parental Dashboard',
          headerTintColor: KIDS_ORANGE,
        }}
      />
      <Stack.Screen
        name="KidsParentalActivity"
        component={KidsActivityMonitorScreen}
        options={{
          headerShown: true,
          headerTitle: 'Activity Log',
          headerTintColor: KIDS_ORANGE,
        }}
      />
      <Stack.Screen
        name="KidsScreenTime"
        component={KidsScreenTimeScreen}
        options={{
          headerShown: true,
          headerTitle: 'Screen Time',
          headerTintColor: KIDS_ORANGE,
        }}
      />
      <Stack.Screen
        name="KidsContentSafety"
        component={KidsContentSafetyScreen}
        options={{
          headerShown: true,
          headerTitle: 'Content Safety',
          headerTintColor: KIDS_ORANGE,
        }}
      />
    </Stack.Navigator>
  );
};
