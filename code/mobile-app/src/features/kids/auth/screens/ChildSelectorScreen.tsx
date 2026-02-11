import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { switchChildThunk, fetchChildrenThunk } from '../store/authSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { ChildProfile } from '../../shared/types';

const AVATAR_EMOJIS = ['🦊', '🐼', '🦄', '🐸', '🦁', '🐰', '🐧', '🦋', '🐱', '🐶'];

interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const KidsChildSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { childProfiles, isLoading } = useAppSelector((s) => s.kidsAuth);

  useEffect(() => {
    dispatch(fetchChildrenThunk());
  }, [dispatch]);

  // No auto-select: always show Netflix-style profile picker; user must tap a profile

  const handleSelect = async (child: ChildProfile) => {
    try {
      await dispatch(switchChildThunk(child.id)).unwrap();
      nav.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'KidsMainTabs' }] }),
      );
    } catch {
      // Error handled by Redux
    }
  };

  const handleAddChild = () => {
    navigation.navigate('KidsCreateChild');
  };

  const getAvatarEmoji = (child: ChildProfile, index: number): string => {
    const config = child.avatarConfig as { avatarEmoji?: string };
    return config?.avatarEmoji || AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
  };

  if (isLoading && childProfiles.length === 0) {
    return <LoadingSpinner message="Loading profiles..." />;
  }

  const renderChild = ({ item, index }: { item: ChildProfile; index: number }) => (
    <TouchableOpacity
      style={styles.childCard}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
      accessibilityLabel={`Select ${item.displayName}`}
      accessibilityRole="button"
    >
      <Text style={styles.avatarEmoji}>{getAvatarEmoji(item, index)}</Text>
      <Text style={styles.childName} numberOfLines={1}>
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

  const renderAddCard = () => (
    <TouchableOpacity
      style={styles.addCard}
      onPress={handleAddChild}
      activeOpacity={0.7}
      accessibilityLabel="Add a new child"
      accessibilityRole="button"
    >
      <Text style={styles.addIcon}>+</Text>
      <Text style={styles.addText}>Add a Child</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who&apos;s learning today?</Text>
      <Text style={styles.subtitle}>Select a profile to get started</Text>

      <FlatList
        data={childProfiles}
        renderItem={renderChild}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListFooterComponent={renderAddCard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kidsColors.background,
    padding: 24,
    paddingTop: 60,
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
  childCard: {
    width: 150,
    height: 160,
    backgroundColor: '#FFFFFF',
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
  avatarEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  childName: {
    ...kidsTypography.body,
    fontWeight: '600',
    color: kidsColors.text.primary,
    textAlign: 'center',
  },
  addCard: {
    width: 150,
    height: 160,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: kidsColors.border,
    borderStyle: 'dashed',
    alignSelf: 'center',
    marginTop: 8,
  },
  addIcon: {
    fontSize: 40,
    color: kidsColors.text.muted,
    marginBottom: 4,
  },
  addText: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.muted,
    fontWeight: '600',
  },
});
