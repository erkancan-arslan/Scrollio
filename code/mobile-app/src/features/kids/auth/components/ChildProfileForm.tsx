/**
 * ChildProfileForm — Form for creating or editing a child profile
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

interface ChildProfileFormProps {
  onSubmit: (data: { displayName: string; dateOfBirth?: string }) => void;
  initialValues?: { displayName?: string; dateOfBirth?: string };
  isLoading?: boolean;
}

export const ChildProfileForm: React.FC<ChildProfileFormProps> = ({
  onSubmit,
  initialValues,
  isLoading = false,
}) => {
  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initialValues?.dateOfBirth ?? '');

  const handleSubmit = () => {
    if (!displayName.trim()) return;
    onSubmit({
      displayName: displayName.trim(),
      ...(dateOfBirth ? { dateOfBirth } : {}),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Child's name"
          placeholderTextColor={kidsColors.text.muted}
          autoCapitalize="words"
          maxLength={30}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Date of Birth (optional)</Text>
        <TextInput
          style={styles.input}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={kidsColors.text.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <KidsThemedButton
        title={initialValues ? 'Update Profile' : 'Create Profile'}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || !displayName.trim()}
        style={styles.submitBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  fieldGroup: { gap: 4 },
  label: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '600' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...kidsTypography.body,
    color: kidsColors.text.primary,
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
  submitBtn: { marginTop: 8 },
});
