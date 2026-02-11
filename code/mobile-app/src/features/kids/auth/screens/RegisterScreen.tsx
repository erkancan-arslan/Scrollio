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
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { registerThunk } from '../store/authSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import {
  isValidEmail,
  isValidPassword,
  isValidDisplayName,
  getPasswordStrength,
} from '../../shared/utils/validators';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export const KidsRegisterScreen: React.FC<Props> = ({ navigation }) => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.kidsAuth);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);
  const strengthColor =
    strength === 'strong'
      ? kidsColors.success
      : strength === 'medium'
        ? kidsColors.warning
        : kidsColors.error;

  const handleRegister = async () => {
    setLocalError(null);

    if (!isValidDisplayName(displayName)) {
      setLocalError('Display name must be 2-30 characters');
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (!isValidPassword(password)) {
      setLocalError('Password must be at least 8 characters with a letter and number');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await dispatch(
        registerThunk({ email: email.trim(), password, displayName: displayName.trim() }),
      ).unwrap();
      // Explicitly navigate to SetPin after successful registration
      nav.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'KidsSetPin' }] }),
      );
    } catch {
      // Error in Redux state
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
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🚀</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Scrollio Kids as a parent</Text>
        </View>

        {displayError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={kidsColors.text.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            editable={!isLoading}
            accessibilityLabel="Display name"
          />

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
              placeholder="Min 8 chars, 1 letter, 1 number"
              placeholderTextColor={kidsColors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Password Strength */}
          {password.length > 0 ? (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthBar, { backgroundColor: strengthColor, flex: strength === 'strong' ? 1 : strength === 'medium' ? 0.66 : 0.33 }]} />
              <View style={[styles.strengthBarBg, { flex: strength === 'strong' ? 0 : strength === 'medium' ? 0.34 : 0.67 }]} />
              <Text style={[styles.strengthText, { color: strengthColor }]}>
                {strength.charAt(0).toUpperCase() + strength.slice(1)}
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={kidsColors.text.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
            accessibilityLabel="Confirm password"
          />

          <KidsThemedButton
            title="Create Parent Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="link">
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 56, marginBottom: 8 },
  title: { ...kidsTypography.heading1, color: kidsColors.primary },
  subtitle: { ...kidsTypography.body, color: kidsColors.text.secondary, marginTop: 4 },
  errorContainer: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: kidsColors.error, ...kidsTypography.bodySmall, textAlign: 'center' },
  form: { marginBottom: 24 },
  label: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: kidsColors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, ...kidsTypography.body, color: kidsColors.text.primary },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: kidsColors.border, borderRadius: 14 },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, ...kidsTypography.body, color: kidsColors.text.primary },
  eyeButton: { paddingHorizontal: 12, paddingVertical: 14 },
  eyeIcon: { fontSize: 20 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, height: 6, borderRadius: 3, overflow: 'hidden' },
  strengthBar: { height: 6, borderRadius: 3 },
  strengthBarBg: { height: 6, backgroundColor: kidsColors.border },
  strengthText: { marginLeft: 8, ...kidsTypography.caption, fontWeight: '600' },
  registerButton: { marginTop: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...kidsTypography.body, color: kidsColors.text.secondary },
  linkText: { ...kidsTypography.body, color: kidsColors.primary, fontWeight: 'bold' },
});
