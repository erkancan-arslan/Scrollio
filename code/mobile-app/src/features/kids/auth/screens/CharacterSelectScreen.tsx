import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions, useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { store } from '../../../../store/store';
import { updateChildThunk, setError } from '../store/authSlice';
import { resetFeed, fetchFeedThunk } from '../../feed/store/feedSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KIDS_CHARACTERS } from '../../shared/constants/characters';
import type { KidsCharacter } from '../../shared/constants/characters';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';
import { childNeedsTopicOnboarding } from '../../shared/utils/childTopicOnboarding';
import type { ChildProfile } from '../../shared/types';

export const KidsCharacterSelectScreen: React.FC = () => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProp<KidsStackParamList, 'KidsCharacterSelect'>>();
  const paramsRef = useRef(route.params);
  paramsRef.current = route.params;

  const { childProfiles, activeChildProfileId, characterSelectChildId, isLoading, error } =
    useAppSelector((s) => s.kidsAuth);

  const fromParams = route.params?.childId;
  const childId =
    (typeof fromParams === 'string' && fromParams) ||
    (typeof characterSelectChildId === 'string' && characterSelectChildId) ||
    activeChildProfileId ||
    null;
  const activeChild = childId ? childProfiles.find((p) => p.id === childId) : null;

  const handleSelect = useCallback(
    async (character: KidsCharacter) => {
      const state = store.getState().kidsAuth;
      let id: string | null =
        paramsRef.current?.childId ??
        state.characterSelectChildId ??
        state.activeChildProfileId ??
        null;
      if (id != null && typeof id === 'string') id = id.trim();
      if (
        !id ||
        typeof id !== 'string' ||
        id === 'undefined' ||
        id.length < 30
      ) {
        dispatch(setError('Lütfen çocuk seçim ekranına dönüp tekrar seçin.'));
        return;
      }
      try {
        const updated = await dispatch(
          updateChildThunk({
            childId: id,
            data: { selectedCharacterId: character.id },
          }),
        ).unwrap();
        dispatch(resetFeed());
        dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
        const afterSave = paramsRef.current?.afterSave ?? 'reset-to-tabs';
        if (afterSave === 'go-back' && nav.canGoBack()) {
          nav.goBack();
          return;
        }
        const raw = updated as unknown as Record<string, unknown>;
        const mapped: ChildProfile = {
          id: (raw.id ?? id) as string,
          parentId: ((raw.parent_id ?? raw.parentId) ?? '') as string,
          displayName: ((raw.display_name ?? raw.displayName) ?? '') as string,
          avatarConfig: ((raw.avatar_config ?? raw.avatarConfig) ?? {}) as Record<string, unknown>,
          dateOfBirth: (raw.date_of_birth ?? raw.dateOfBirth) as string | undefined,
          isActive: ((raw.is_active ?? raw.isActive) ?? true) as boolean,
          createdAt: ((raw.created_at ?? raw.createdAt) ?? '') as string,
          updatedAt: ((raw.updated_at ?? raw.updatedAt) ?? '') as string,
          selectedCharacterId: (raw.selected_character_id ?? raw.selectedCharacterId) as string | undefined,
          topicOnboardingCompletedAt: (raw.topic_onboarding_completed_at ??
            raw.topicOnboardingCompletedAt) as string | undefined,
        };
        if (childNeedsTopicOnboarding(mapped) && mapped.selectedCharacterId) {
          nav.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'KidsOnboardingTopics' }] }),
          );
        } else {
          nav.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'KidsMainTabs' }] }),
          );
        }
      } catch {
        // Error stored in kidsAuth.error and shown below
      }
    },
    [dispatch, nav]
  );

  const renderCharacter = ({ item }: { item: KidsCharacter }) => (
    <TouchableOpacity
      style={styles.characterCard}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
      disabled={isLoading}
      accessibilityLabel={`Select ${item.name}`}
      accessibilityRole="button"
    >
      <Text style={styles.characterEmoji}>{item.emoji}</Text>
      <Text style={styles.characterName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.errorText}>No profile selected. Go back and pick who&apos;s learning.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>Seni hangi arkadaş anlatsın?</Text>
      <Text style={styles.subtitle}>Bir canavar seç — videolarda o seninle olacak!</Text>

      <FlatList
        data={KIDS_CHARACTERS}
        renderItem={renderCharacter}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
      />
      {isLoading && (
        <Text style={styles.savingText}>Kaydediliyor...</Text>
      )}
      {error && (
        <Text style={styles.errorBanner}>Kaydedilemedi. Tekrar dene. ({error})</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kidsColors.background,
    padding: 24,
    paddingTop: 16,
  },
  title: {
    ...kidsTypography.heading1,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  characterCard: {
    width: 150,
    height: 160,
    backgroundColor: kidsColors.backgroundCard,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  characterEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  characterName: {
    ...kidsTypography.body,
    fontWeight: '600',
    color: kidsColors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
  },
  savingText: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.muted,
    textAlign: 'center',
    marginTop: 16,
  },
  errorBanner: {
    ...kidsTypography.bodySmall,
    color: kidsColors.error ?? '#c62828',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});
