/**
 * Search Screen
 * Allows users to search for other users and send friend requests
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchService, UserSearchResult } from '../../../services/search';
import { friendsService } from '../../../services/friends';
import { colors } from '../../../theme/colors';
import { debounce } from 'lodash';

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length === 0) {
        setResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const response = await searchService.searchUsers(query, 20);
      setIsSearching(false);
      setHasSearched(true);

      if (response.success && response.data) {
        setResults(response.data.users);
      } else {
        Alert.alert('Error', response.error || 'Failed to search users');
        setResults([]);
      }
    }, 500),
    [],
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  const handleSendFriendRequest = async (userId: string) => {
    setSendingRequestTo(userId);
    const response = await friendsService.sendFriendRequest(userId);
    setSendingRequestTo(null);

    if (response.success) {
      // Update the local state to reflect the pending status
      setResults((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, friendship_status: 'pending' }
            : user
        ),
      );
      Alert.alert('Success', 'Friend request sent!');
    } else {
      Alert.alert('Error', response.error || 'Failed to send friend request');
    }
  };

  const renderFriendshipButton = (user: UserSearchResult) => {
    const isLoading = sendingRequestTo === user.id;

    switch (user.friendship_status) {
      case 'accepted':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statusText}>Friends</Text>
          </View>
        );

      case 'pending':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
            <Text style={styles.statusTextPending}>Pending</Text>
          </View>
        );

      case 'rejected':
      case 'blocked':
        return null;

      case 'none':
      default:
        return (
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.addButtonDisabled]}
            onPress={() => handleSendFriendRequest(user.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#FFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        );
    }
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={colors.text.secondary} />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.display_name || 'Anonymous'}</Text>
          <View style={styles.levelContainer}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={styles.levelText}>
              Level {item.level} • {item.xp} XP
            </Text>
          </View>
        </View>
      </View>
      {renderFriendshipButton(item)}
    </View>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return null;
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>Search for Users</Text>
          <Text style={styles.emptyText}>
            Find friends by their display name or email
          </Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptyText}>
            Try searching with a different name or email
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Users</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.text.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  statusTextPending: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
