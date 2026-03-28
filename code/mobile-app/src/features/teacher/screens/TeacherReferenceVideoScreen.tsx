import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';
import { secureStorage } from '../../../services/storage/secureStorage';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherReferenceVideo'>;
};

export const TeacherReferenceVideoScreen: React.FC<Props> = ({ navigation }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const res = await apiClient.get<any>('/teacher/profile');
    if (res.data) setProfile(res.data);
    setLoading(false);
  };

  const pickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setFileName(asset.name);
    setUploading(true);

    try {
      const { accessToken } = await secureStorage.getSession();
      const baseUrl = apiClient.getBaseUrl();

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.name);
      } else {
        formData.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType || 'video/mp4' } as any);
      }

      const res = await fetch(`${baseUrl}/teacher/profile/reference-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Upload failed (${res.status})`);
      }

      Alert.alert('Başarılı', 'Referans video yüklendi.');
      loadProfile();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Yükleme başarısız.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={teacherColors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Referans Video</Text>
        <Text style={styles.desc}>
          Lipsync için kullanılacak referans videonuzu yükleyin. Kısa (10-30 sn), yüzünüzün net göründüğü bir video idealdir.
        </Text>

        {profile?.reference_video_status === 'ready' && (
          <View style={styles.currentBox}>
            <Text style={styles.currentLabel}>Mevcut video:</Text>
            <Text style={styles.currentUrl} numberOfLines={2}>
              {profile.reference_video_url}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.btnDisabled]}
          onPress={pickAndUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={teacherColors.inverse} />
          ) : (
            <Text style={styles.uploadBtnText}>
              {profile?.reference_video_status === 'ready' ? 'Yeni Video Yükle' : 'Video Yükle'}
            </Text>
          )}
        </TouchableOpacity>

        {fileName ? <Text style={styles.fileInfo}>Seçilen: {fileName}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: 16, fontWeight: '600', color: teacherColors.primary },
  title: { fontSize: 24, fontWeight: '700', color: teacherColors.text, marginBottom: 8 },
  desc: { fontSize: 14, color: teacherColors.textMuted, lineHeight: 20, marginBottom: spacing.lg },
  currentBox: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: spacing.lg,
  },
  currentLabel: { fontSize: 13, fontWeight: '600', color: '#2E7D32', marginBottom: 4 },
  currentUrl: { fontSize: 12, color: '#37474F' },
  uploadBtn: {
    backgroundColor: teacherColors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  uploadBtnText: { color: teacherColors.inverse, fontSize: 16, fontWeight: '700' },
  fileInfo: { marginTop: 12, fontSize: 13, color: teacherColors.textSecondary },
});
