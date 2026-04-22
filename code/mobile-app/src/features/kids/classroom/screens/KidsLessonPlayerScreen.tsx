import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Audio } from 'expo-av';
import { SlideRenderer } from '../components/SlideRenderer';
import { apiClient } from '../../../../services/api/apiClient';
import { spacing } from '../../../../theme';
import { ScreenTimeGuard } from '../../parental/components/ScreenTimeGuard';

const KIDS_ORANGE = '#FF6B35';

type Params = { lessonId: string };

interface Slide {
  index: number;
  title: string;
  content: string;
  bulletPoints: string[];
  narrationText: string;
  audioUrl?: string;
  videoUrl?: string;
}

export const KidsLessonPlayerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: Params }, 'params'>>();
  const { lessonId } = route.params;

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiClient.get<any>(`/kids/classroom/lessons/${lessonId}`);
      if (res.data) setLesson(res.data);
      setLoading(false);
    })();
  }, [lessonId]);

  const slides: Slide[] = lesson?.slides_data || [];
  const slide = slides[currentSlide];

  const unloadAudio = useCallback(async () => {
    if (audioRef.current) {
      try { await audioRef.current.unloadAsync(); } catch { /* ignore */ }
      audioRef.current = null;
    }
  }, []);

  const advanceSlide = useCallback(() => {
    setCurrentSlide(prev => {
      const total = lesson?.slides_data?.length ?? 0;
      return prev < total - 1 ? prev + 1 : prev;
    });
  }, [lesson]);

  const loadSlideMedia = useCallback(async (s: Slide, play: boolean) => {
    await unloadAudio();

    // If slide has a video, expo-av Video handles it via ref (see onSlideChange below)
    if (s.videoUrl) return;

    // Audio-only slide
    if (s.audioUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: s.audioUrl },
          { shouldPlay: play },
        );
        audioRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) advanceSlide();
        });
      } catch { /* ignore */ }
    }
  }, [unloadAudio, advanceSlide]);

  // When slide changes: load video into ref or load audio
  useEffect(() => {
    if (!slide) return;

    if (slide.videoUrl && videoRef.current) {
      videoRef.current
        .loadAsync({ uri: slide.videoUrl }, { shouldPlay: isPlaying })
        .catch(() => {});
    } else {
      loadSlideMedia(slide, isPlaying);
    }

    return () => { unloadAudio(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide]);

  const togglePlay = async () => {
    const next = !isPlaying;
    setIsPlaying(next);

    if (slide?.videoUrl && videoRef.current) {
      if (next) videoRef.current.playAsync().catch(() => {});
      else videoRef.current.pauseAsync().catch(() => {});
    } else if (audioRef.current) {
      if (next) audioRef.current.playAsync().catch(() => {});
      else audioRef.current.pauseAsync().catch(() => {});
    }
  };

  const goToPrev = () => {
    if (currentSlide > 0) setCurrentSlide(p => p - 1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={KIDS_ORANGE} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!lesson || slides.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.emptyText}>Ders içeriği bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <ScreenTimeGuard>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
        <Text style={styles.slideCount}>{currentSlide + 1}/{slides.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentSlide + 1) / slides.length) * 100}%` as any },
          ]}
        />
      </View>

      {/* Slide content + PiP video */}
      <View style={styles.slideArea}>
        <SlideRenderer slide={slide} />

        {/* PiP lipsync video — expo-av Video works on web + native */}
        {slide.videoUrl ? (
          <View style={styles.pipContainer}>
            <Video
              ref={videoRef}
              source={{ uri: slide.videoUrl }}
              style={styles.pipVideo}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying}
              isLooping={false}
              useNativeControls={false}
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) advanceSlide();
              }}
            />
          </View>
        ) : null}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={goToPrev}
          disabled={currentSlide === 0}
          style={[styles.controlBtn, currentSlide === 0 && styles.disabled]}
        >
          <Ionicons name="play-back" size={28} color={KIDS_ORANGE} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={advanceSlide}
          disabled={currentSlide >= slides.length - 1}
          style={[styles.controlBtn, currentSlide >= slides.length - 1 && styles.disabled]}
        >
          <Ionicons name="play-forward" size={28} color={KIDS_ORANGE} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </ScreenTimeGuard>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: 8, gap: 10,
  },
  lessonTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  slideCount: { fontSize: 14, fontWeight: '700', color: KIDS_ORANGE },
  progressBar: {
    height: 4, backgroundColor: '#FFE0B2', marginHorizontal: spacing.md, borderRadius: 2,
  },
  progressFill: { height: 4, backgroundColor: KIDS_ORANGE, borderRadius: 2 },
  slideArea: {
    flex: 1, margin: spacing.md, position: 'relative',
  },
  pipContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: '#000',
  },
  pipVideo: {
    width: '100%' as any,
    height: '100%' as any,
  },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 24,
  },
  controlBtn: { padding: 8 },
  disabled: { opacity: 0.3 },
  playBtn: {
    backgroundColor: KIDS_ORANGE, width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center', marginTop: 40, fontSize: 16, color: '#555',
  },
});
