/**
 * AuthForm — Reusable email/password form for login and registration
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

interface AuthFormProps {
  mode?: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; displayName?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode = 'login',
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = () => {
    onSubmit({
      email: email.trim(),
      password,
      ...(mode === 'register' ? { displayName: displayName.trim() } : {}),
    });
  };

  return (
    <View style={styles.container}>
      {mode === 'register' && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={kidsColors.text.muted}
            autoCapitalize="words"
          />
        </View>
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          placeholderTextColor={kidsColors.text.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={kidsColors.text.muted}
          secureTextEntry
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <KidsThemedButton
        title={mode === 'login' ? 'Log In' : 'Create Account'}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || !email || !password}
        style={styles.submitBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  fieldGroup: { gap: 4 },
  label: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '600' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...kidsTypography.body,
    color: kidsColors.text.primary,
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
  error: { ...kidsTypography.bodySmall, color: kidsColors.error, textAlign: 'center' },
  submitBtn: { marginTop: 8 },
});
