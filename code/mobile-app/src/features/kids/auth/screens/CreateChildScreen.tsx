import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createChildThunk } from '../store/authSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import { isValidDisplayName } from '../../shared/utils/validators';

const AVATAR_OPTIONS = [
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { id: 'frog', emoji: '🐸', label: 'Frog' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'bunny', emoji: '🐰', label: 'Bunny' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'dragon', emoji: '🐉', label: 'Dragon' },
  { id: 'octopus', emoji: '🐙', label: 'Octopus' },
];

interface Props {
  navigation: {
    goBack: () => void;
  };
}

export const KidsCreateChildScreen: React.FC<Props> = ({ navigation }) => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.kidsAuth);

  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLocalError(null);

    if (!isValidDisplayName(displayName)) {
      setLocalError('Name must be 2-30 characters');
      return;
    }

    const avatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar);
    try {
      await dispatch(
        createChildThunk({
          displayName: displayName.trim(),
          dateOfBirth: dateOfBirth || undefined,
          avatarConfig: {
            avatarId: selectedAvatar,
            avatarEmoji: avatar?.emoji ?? '🦊',
          },
        }),
      ).unwrap();
      // Navigate to child selector to pick the newly created child
      nav.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'KidsChildSelector' }] }),
      );
    } catch {
      // Error in Redux state
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add a Learner</Text>
        <Text style={styles.subtitle}>Create a profile for your child</Text>

        {displayError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Child&apos;s Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          placeholderTextColor={kidsColors.text.muted}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          editable={!isLoading}
          accessibilityLabel="Child's name"
        />

        <Text style={styles.label}>Date of Birth (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={kidsColors.text.muted}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          keyboardType="numbers-and-punctuation"
          editable={!isLoading}
          accessibilityLabel="Date of birth"
        />

        <Text style={styles.label}>Choose an Avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar.id && styles.avatarSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar.id)}
              accessibilityLabel={`Select ${avatar.label} avatar`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedAvatar === avatar.id }}
            >
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <KidsThemedButton
          title="Create Profile"
          onPress={handleCreate}
          loading={isLoading}
          disabled={isLoading}
          style={styles.createButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  title: { ...kidsTypography.heading1, color: kidsColors.text.primary, textAlign: 'center', marginBottom: 4 },
  subtitle: { ...kidsTypography.body, color: kidsColors.text.secondary, textAlign: 'center', marginBottom: 24 },
  errorContainer: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: kidsColors.error, ...kidsTypography.bodySmall, textAlign: 'center' },
  label: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: kidsColors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, ...kidsTypography.body, color: kidsColors.text.primary },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, justifyContent: 'center' },
  avatarOption: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: kidsColors.primary, backgroundColor: kidsColors.primaryLight + '20' },
  avatarEmoji: { fontSize: 36 },
  createButton: { marginTop: 32, marginBottom: 24 },
});
