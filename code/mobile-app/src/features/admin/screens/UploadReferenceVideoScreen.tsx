import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import * as adminApi from '../services/adminApi';
import { secureStorage } from '../../../services/storage/secureStorage';

const API_BASE = (() => {
  if (!__DEV__) return 'https://api.scrollio.app/api/v1';
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return 'http://localhost:3001/api/v1';
})();

export const UploadReferenceVideoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [personaName, setPersonaName] = useState('');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [audienceTag, setAudienceTag] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [videoUrl, setVideoUrl] = useState('');

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
        setError('');
      }
    } catch (err) {
      console.error('[Admin] File picker error:', err);
      setError('Dosya seçilemedi.');
    }
  };

  const handleUpload = async () => {
    setError('');
    setSuccess(false);

    if (!title.trim()) {
      setError('Başlık zorunludur.');
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      setError('Lütfen bir video dosyası seçin.');
      return;
    }

    if (uploadMode === 'url' && !videoUrl.trim()) {
      setError('Video URL zorunludur.');
      return;
    }

    setLoading(true);

    try {
      if (uploadMode === 'file' && selectedFile) {
        const { accessToken } = await secureStorage.getSession();
        if (!accessToken) {
          setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        if (description.trim()) formData.append('description', description.trim());
        if (personaName.trim()) formData.append('personaName', personaName.trim());
        formData.append('language', language);
        if (audienceTag) formData.append('audienceTag', audienceTag);

        const fileUri = selectedFile.uri;
        const fileName = selectedFile.name || 'video.mp4';
        const mimeType = selectedFile.mimeType || 'video/mp4';

        if (Platform.OS === 'web') {
          const response = await fetch(fileUri);
          const blob = await response.blob();
          formData.append('file', blob, fileName);
        } else {
          formData.append('file', {
            uri: fileUri,
            name: fileName,
            type: mimeType,
          } as any);
        }

        const res = await fetch(`${API_BASE}/admin/reference-videos/upload-file`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });

        if (!res.ok) {
          const body = await res.text();
          console.error('[Admin Upload] Server error:', res.status, body);
          setError(`Yükleme başarısız: ${res.status}. ${body.slice(0, 200)}`);
          setLoading(false);
          return;
        }

        setSuccess(true);
        setLoading(false);
        Alert.alert('Başarılı', 'Referans video yüklendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      } else {
        const res = await adminApi.uploadReferenceVideo({
          title: title.trim(),
          description: description.trim() || undefined,
          personaName: personaName.trim() || undefined,
          language,
          audienceTag: audienceTag || undefined,
          storagePath: videoUrl.trim(),
          publicUrl: videoUrl.trim(),
        });

        if (res.error) {
          const msg = res.status === 401 || res.status === 403
            ? 'Yetki yok. Admin hesabıyla giriş yapın.'
            : res.error;
          setError(msg);
          setLoading(false);
          return;
        }

        setSuccess(true);
        setLoading(false);
        Alert.alert('Başarılı', 'Referans video yüklendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error('[Admin Upload] Exception:', msg);
      setError(`Yükleme hatası: ${msg}`);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Referans Video Yükle" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <Text style={styles.label}>Başlık *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="örn. Fizik Dersi - Artun" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Kısa açıklama" multiline numberOfLines={3} placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Kişi Adı</Text>
        <TextInput style={styles.input} value={personaName} onChangeText={setPersonaName} placeholder="örn. Artun" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Dil *</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, language === 'tr' && styles.segmentActive]} onPress={() => setLanguage('tr')}>
            <Text style={[styles.segmentText, language === 'tr' && styles.segmentTextActive]}>Türkçe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, language === 'en' && styles.segmentActive]} onPress={() => setLanguage('en')}>
            <Text style={[styles.segmentText, language === 'en' && styles.segmentTextActive]}>İngilizce</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Hedef Kitle</Text>
        <View style={styles.segmentRow}>
          {['', 'core', 'kids'].map((tag) => (
            <TouchableOpacity key={tag} style={[styles.segment, audienceTag === tag && styles.segmentActive]} onPress={() => setAudienceTag(tag)}>
              <Text style={[styles.segmentText, audienceTag === tag && styles.segmentTextActive]}>
                {tag === '' ? 'Hepsi' : tag === 'core' ? 'Core' : 'Kids'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upload mode toggle */}
        <Text style={styles.label}>Video Kaynağı *</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, uploadMode === 'file' && styles.segmentActive]} onPress={() => setUploadMode('file')}>
            <Text style={[styles.segmentText, uploadMode === 'file' && styles.segmentTextActive]}>Dosya Yükle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, uploadMode === 'url' && styles.segmentActive]} onPress={() => setUploadMode('url')}>
            <Text style={[styles.segmentText, uploadMode === 'url' && styles.segmentTextActive]}>URL Gir</Text>
          </TouchableOpacity>
        </View>

        {uploadMode === 'file' ? (
          <View style={styles.fileSection}>
            <Text style={styles.hint}>
              Yüzü net görünen, konuşan bir kişinin videosunu seçin (MP4). Lipsync bu videodaki yüzü TTS sesine senkron eder.
            </Text>
            <TouchableOpacity style={styles.filePickerBtn} onPress={pickFile}>
              <Text style={styles.filePickerBtnText}>
                {selectedFile ? '📁 ' + selectedFile.name : '📁 Video Dosyası Seç'}
              </Text>
            </TouchableOpacity>
            {selectedFile && (
              <Text style={styles.fileInfo}>
                {selectedFile.name} ({((selectedFile.size || 0) / 1024 / 1024).toFixed(1)} MB)
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.fileSection}>
            <Text style={styles.hint}>
              Doğrudan erişilebilir bir video URL'i girin (Supabase Storage, Cloudinary vb.). catbox.moe gibi siteler çalışmayabilir.
            </Text>
            <TextInput style={styles.input} value={videoUrl} onChangeText={setVideoUrl} placeholder="https://..." autoCapitalize="none" placeholderTextColor={colors.text.tertiary} />
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>Referans video başarıyla yüklendi.</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadBtnText}>Yükle</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: adminColors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: adminColors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  segmentTextActive: {
    color: colors.text.inverse,
  },
  fileSection: {
    marginTop: spacing.sm,
  },
  filePickerBtn: {
    backgroundColor: adminColors.background,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.primary,
    borderStyle: 'dashed',
  },
  filePickerBtnText: {
    color: adminColors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  fileInfo: {
    fontSize: typography.fontSize.xs,
    color: adminColors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorBannerText: {
    color: '#C62828',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  successBannerText: {
    color: '#2E7D32',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  uploadBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  uploadBtnText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
