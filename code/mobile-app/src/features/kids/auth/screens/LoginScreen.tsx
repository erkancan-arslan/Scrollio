import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { loginThunk, fetchChildrenThunk, fetchMeThunk } from '../store/authSlice';
import { UserRole } from '../../shared/types';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import { isValidEmail } from '../../shared/utils/validators';
import { store } from '../../../../store/store';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const KidsLoginScreen: React.FC<Props> = ({ navigation }) => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.kidsAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Please enter your email address');
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      const result = await dispatch(loginThunk({ email: email.trim(), password })).unwrap();
      if (result) {
        // After login, fetch additional data
        await dispatch(fetchMeThunk()).catch(() => {});
        await dispatch(fetchChildrenThunk()).catch(() => {});

        // Read updated state and navigate to the correct next screen
        const st = store.getState().kidsAuth;
        const isParentOrSchool =
          st.userRole === UserRole.PARENT || st.userRole === UserRole.SCHOOL;

        let next: string = 'KidsMainTabs';
        if (!isParentOrSchool) {
          next = 'KidsRoleBlocked';
        } else if (!st.isPinSet) {
          next = 'KidsSetPin';
        } else {
          // PIN is set but not verified yet in this session
          next = 'KidsPinEntry';
        }

        nav.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: next }] }),
        );
      }
    } catch (err) {
      // Error is already in Redux state
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Branding */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🎨</Text>
          <Text style={styles.title}>Scrollio Kids</Text>
          <Text style={styles.subtitle}>Fun learning for ages 7-12</Text>
        </View>

        {/* Error Display */}
        {displayError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="parent@example.com"
            placeholderTextColor={kidsColors.text.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor={kidsColors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <KidsThemedButton
            title="Log In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          />
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('KidsRegister')}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kidsColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    ...kidsTypography.heading1,
    color: kidsColors.primary,
  },
  subtitle: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: kidsColors.error,
    ...kidsTypography.bodySmall,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.primary,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: kidsColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...kidsTypography.body,
    color: kidsColors.text.primary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: kidsColors.border,
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...kidsTypography.body,
    color: kidsColors.text.primary,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginButton: {
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
  },
  linkText: {
    ...kidsTypography.body,
    color: kidsColors.primary,
    fontWeight: 'bold',
  },
});
