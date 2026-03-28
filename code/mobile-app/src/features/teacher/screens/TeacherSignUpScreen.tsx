import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';
import { secureStorage } from '../../../services/storage/secureStorage';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherSignUp'>;
};

export const TeacherSignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Ad, e-posta ve şifre zorunludur.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await apiClient.post<any>('/teacher/auth/signup', {
      name: name.trim(),
      email: email.trim(),
      password,
      school: school.trim() || undefined,
      subject: subject.trim() || undefined,
    }, false);

    setLoading(false);

    if (res.error || !res.data?.session) {
      setError(res.error || 'Kayıt başarısız.');
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'<'} Geri</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Öğretmen Kaydı</Text>
            <Text style={styles.subtitle}>Yeni öğretmen hesabı oluşturun</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field label="Ad Soyad *" value={name} onChangeText={setName} placeholder="Ahmet Yılmaz" />
            <Field label="E-posta *" value={email} onChangeText={setEmail} placeholder="teacher@school.edu" keyboardType="email-address" />
            <Field label="Şifre *" value={password} onChangeText={setPassword} placeholder="En az 6 karakter" secureTextEntry />
            <Field label="Okul" value={school} onChangeText={setSchool} placeholder="Ankara Lisesi" />
            <Field label="Branş" value={subject} onChangeText={setSubject} placeholder="Matematik" />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={teacherColors.inverse} />
              ) : (
                <Text style={styles.btnText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
}> = ({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={teacherColors.textMuted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
    />
  </View>
);

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
  errorBox: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: spacing.sm, marginBottom: spacing.md },
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
});
