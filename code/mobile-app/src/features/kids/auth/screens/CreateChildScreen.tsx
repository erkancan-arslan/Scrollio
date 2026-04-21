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
  Pressable,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const KidsCreateChildScreen: React.FC<Props> = ({ navigation }) => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.kidsAuth);

  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLocalError(null);

    if (!isValidDisplayName(displayName)) {
      setLocalError('Name must be 2-30 characters');
      return;
    }
    if (!dateOfBirth) {
      setLocalError('Date of birth is required');
      return;
    }

    const avatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar);
    try {
      await dispatch(
        createChildThunk({
          displayName: displayName.trim(),
          dateOfBirth: toIsoDate(dateOfBirth),
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
  const maximumDob = new Date();
  maximumDob.setFullYear(maximumDob.getFullYear() - 7);
  const minimumDob = new Date();
  minimumDob.setFullYear(minimumDob.getFullYear() - 12);
  const dobLabel = dateOfBirth ? toIsoDate(dateOfBirth) : 'Select date of birth';

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

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

        <Text style={styles.label}>Date of Birth</Text>
        <Pressable
          style={styles.datePickerTrigger}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose date of birth"
          disabled={isLoading}
        >
          <Text style={[styles.datePickerText, !dateOfBirth && styles.datePlaceholder]}>
            {dobLabel}
          </Text>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={dateOfBirth ?? maximumDob}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            minimumDate={minimumDob}
            maximumDate={maximumDob}
          />
        ) : null}
        {showDatePicker && Platform.OS === 'ios' ? (
          <KidsThemedButton
            title="Done"
            onPress={() => setShowDatePicker(false)}
            disabled={isLoading}
            style={styles.doneButton}
          />
        ) : null}

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
  datePickerTrigger: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: kidsColors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  datePickerText: { ...kidsTypography.body, color: kidsColors.text.primary },
  datePlaceholder: { color: kidsColors.text.muted },
  doneButton: { marginTop: 10 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, justifyContent: 'center' },
  avatarOption: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: kidsColors.primary, backgroundColor: kidsColors.primaryLight + '20' },
  avatarEmoji: { fontSize: 36 },
  createButton: { marginTop: 32, marginBottom: 24 },
});
