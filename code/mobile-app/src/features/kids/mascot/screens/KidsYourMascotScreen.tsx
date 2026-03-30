/**
 * Your Mascot — entry from Profile. Shows create CTA, progress, or finished video.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { hydrateKidsMascot } from '../store/mascotSlice';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

const { width: SCREEN_W } = Dimensions.get('window');
/** Portrait 9:16 — width : height = 9 : 16 */
const VIDEO_W = Math.min(SCREEN_W - 48, 360);
const VIDEO_H = (VIDEO_W * 16) / 9;

type Nav = StackNavigationProp<KidsStackParamList, 'KidsYourMascot'>;

const MascotVideoPlayer: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    return () => {
      try {
        player.pause();
        player.release();
      } catch {
        /* already released */
      }
    };
  }, [player]);

  useEffect(() => {
    try {
      player.play();
    } catch {
      /* noop */
    }
  }, [uri, player]);

  return (
    <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />
  );
};

export const KidsYourMascotScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { status, progressMessage, videoUrl, error } = useAppSelector((s) => s.kidsMascot);

  useEffect(() => {
    dispatch(hydrateKidsMascot());
  }, [dispatch]);

  const showCreate = status === 'none' || status === 'failed';
  const showGenerating = status === 'generating';
  const showVideo = status === 'ready' && !!videoUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your mascot</Text>
      <Text style={styles.subtitle}>
        Turn your drawing into a 3D-style mascot and a short welcome video.
      </Text>

      {showGenerating ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={kidsColors.primary} />
          <Text style={styles.progressText}>{progressMessage || 'Working on your mascot…'}</Text>
          <Text style={styles.muted}>You can leave this screen — we&apos;ll let you know when it&apos;s ready.</Text>
        </View>
      ) : null}

      {error && status === 'failed' ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {showVideo && videoUrl ? (
        <View style={styles.videoWrap}>
          <MascotVideoPlayer uri={videoUrl} />
          <Text style={styles.scriptHint}>
            Script: &quot;Hi! I am your mascot, let&apos;s learn!&quot;
          </Text>
        </View>
      ) : null}

      {showCreate ? (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('KidsMascotDraw')}
          accessibilityRole="button"
          accessibilityLabel="Create your own mascot"
        >
          <Text style={styles.primaryBtnText}>Create your own mascot</Text>
        </TouchableOpacity>
      ) : null}

      {status === 'ready' && videoUrl ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('KidsMascotDraw')}
          accessibilityRole="button"
          accessibilityLabel="Create a new mascot drawing"
        >
          <Text style={styles.secondaryBtnText}>Draw a new mascot</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 24, paddingBottom: 48 },
  title: { ...kidsTypography.heading2, color: kidsColors.text.primary, marginBottom: 8 },
  subtitle: { ...kidsTypography.body, color: kidsColors.text.muted, marginBottom: 24 },
  centerBlock: { alignItems: 'center', paddingVertical: 32 },
  progressText: {
    ...kidsTypography.body,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  muted: {
    ...kidsTypography.caption,
    color: kidsColors.text.muted,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', ...kidsTypography.bodySmall },
  videoWrap: {
    width: VIDEO_W,
    alignSelf: 'center',
    marginBottom: 20,
  },
  video: {
    width: VIDEO_W,
    height: VIDEO_H,
    borderRadius: 16,
    backgroundColor: '#000',
  },
  scriptHint: {
    ...kidsTypography.caption,
    color: kidsColors.text.muted,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  primaryBtn: {
    backgroundColor: kidsColors.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: kidsColors.primary, fontWeight: '700', fontSize: 15 },
});
