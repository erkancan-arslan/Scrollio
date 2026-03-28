import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing, typography } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';
import { secureStorage } from '../../../services/storage/secureStorage';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherSignIn'>;
};

export const TeacherSignInScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre girin.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await apiClient.post<any>('/teacher/auth/signin', {
      email: email.trim(),
      password,
    }, false);

    setLoading(false);

    if (res.error || !res.data?.session) {
      setError(res.error || 'Giriş başarısız.');
      return;
    }

    await secureStorage.setSession({
      accessToken: res.data.session.accessToken,
      refreshToken: res.data.session.refreshToken,
      expiresAt: res.data.session.expiresAt,
      userId: res.data.user.id,
    });

    navigation.reset({ index: 0, routes: [{ name: 'TeacherDashboard' }] });
  };

  const goBack = () => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>{'<'} Geri</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Teacher Panel</Text>
            <Text style={styles.subtitle}>Öğretmen hesabınızla giriş yapın</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputWrap}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="teacher@school.edu"
                placeholderTextColor={teacherColors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={teacherColors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={teacherColors.inverse} />
              ) : (
                <Text style={styles.btnText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpLink}
              onPress={() => navigation.navigate('TeacherSignUp')}
            >
              <Text style={styles.signUpText}>Hesabınız yok mu? Kayıt olun</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: 16, fontWeight: '600', color: teacherColors.primary },
  header: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '700', color: teacherColors.text, marginBottom: 4 },
  subtitle: { fontSize: 16, color: teacherColors.textMuted },
  card: {
    backgroundColor: teacherColors.background,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: teacherColors.border,
  },
  errorBox: {
    backgroundColor: '#FFEBEE', borderRadius: 10, padding: spacing.sm, marginBottom: spacing.md,
  },
  errorText: { color: '#C62828', fontSize: 14 },
  inputWrap: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: teacherColors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: teacherColors.backgroundTint,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: teacherColors.text,
    borderWidth: 1,
    borderColor: teacherColors.border,
  },
  btn: {
    backgroundColor: teacherColors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: teacherColors.inverse, fontSize: 16, fontWeight: '700' },
  signUpLink: { marginTop: spacing.md, alignItems: 'center' },
  signUpText: { color: teacherColors.primary, fontSize: 14 },
});
