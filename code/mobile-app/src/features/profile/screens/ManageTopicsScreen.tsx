/**
 * ManageTopicsScreen
 * Lets users view, add, and remove their feed topic interests.
 * Accessible from the profile screen (edit mode) — same UX as onboarding.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { feedService } from '../../../services/feed/feedService';
import { profileService } from '../../../services/profile/profileService';

type RouteProps = RouteProp<RootStackParamList, 'ManageTopics'>;

const ACCENT = '#FF8C42';
const BG = '#F7F3ED';
const MIN_SELECTIONS = 1;

const TOPIC_EMOJI: Record<string, string> = {
  'Financial Markets':    '📈',
  'Personal Finance':     '💰',
  'Economics':            '📊',
  'Investing':            '💎',
  'Computer Networks':    '🌐',
  'Discrete Mathematics': '🔢',
  'Mathematics':          '📐',
  'History':              '📜',
  'Chess':                '♟️',
  'Backgammon':           '🎲',
  'Colors':               '🎨',
  'Science':              '🔬',
  'Technology':           '💻',
  'Psychology':           '🧠',
  'Health':               '💪',
  'Music':                '🎵',
  'Art':                  '🖼️',
  'Space':                '🌌',
  'Philosophy':           '🤔',
  'Literature':           '📚',
  'Politics':             '🗳️',
  'Sports':               '⚽',
  'Food':                 '🍳',
  'Travel':               '✈️',
  'Environment':          '🌱',
  'Film':                 '🎬',
};

const getEmoji = (topic: string) => TOPIC_EMOJI[topic] ?? '📚';

export const ManageTopicsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const currentTopics: string[] = route.params?.currentTopics ?? [];

  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentTopics));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await feedService.getVideoTopics();
      if (result.data && result.data.topics.length > 0) {
        setAllTopics(result.data.topics);
      } else {
        setLoadError('Could not load topics. Please try again.');
      }
      setLoadingTopics(false);
    })();
  }, []);

  const toggleTopic = (topic: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        if (next.size <= MIN_SELECTIONS) return prev; // keep minimum
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const hasChanges = () => {
    const prevSet = new Set(currentTopics);
    if (prevSet.size !== selected.size) return true;
    for (const t of selected) if (!prevSet.has(t)) return true;
    return false;
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    const result = await profileService.updateProfile({
      preferences: { preferredTopics: Array.from(selected) },
    });

    setSaving(false);

    if (result.error) {
      Alert.alert('Error', 'Could not save your topics. Please try again.');
      return;
    }

    navigation.goBack();
  };

  const selectedCount = selected.size;
  const canSave = selectedCount >= MIN_SELECTIONS && hasChanges();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Interests</Text>
          <Text style={styles.headerSubtitle}>{selectedCount} selected</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Tap a topic to add or remove it from your feed.
      </Text>

      {/* Topic Grid */}
      {loadingTopics ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : loadError ? (
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {allTopics.map((topic) => {
            const isSelected = selected.has(topic);
            return (
              <TouchableOpacity
                key={topic}
                style={[styles.tile, isSelected && styles.tileSelected]}
                onPress={() => toggleTopic(topic)}
                activeOpacity={0.75}
              >
                <Text style={styles.tileEmoji}>{getEmoji(topic)}</Text>
                <Text
                  style={[styles.tileLabel, isSelected && styles.tileLabelSelected]}
                  numberOfLines={2}
                >
                  {topic}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Sticky bottom save bar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 8 : 16) }]}>
        <TouchableOpacity
          style={[styles.saveBarBtn, (!canSave || saving) && styles.saveBarBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBarBtnText}>
              {canSave ? 'Save Changes' : 'No Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: { padding: 2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 12, color: '#999', marginTop: 1 },
  saveBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center' },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    justifyContent: 'center',
  },
  tile: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    paddingHorizontal: 6,
  },
  tileSelected: { backgroundColor: '#FFF2E8', borderColor: ACCENT },
  tileEmoji: { fontSize: 28, marginBottom: 6 },
  tileLabel: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center', lineHeight: 14 },
  tileLabelSelected: { color: ACCENT },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Footer save bar
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  saveBarBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBarBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  saveBarBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
