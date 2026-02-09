/**
 * Friends Screen
 * Shows friends list, pending requests, and sent requests
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  friendsService,
  FriendProfile,
  PendingRequest,
} from '../../../services/friends';
import { chatService } from '../../../services/chat';
import { colors } from '../../../theme/colors';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'friends' | 'requests';

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadFriends(), loadPendingRequests()]);
    setIsLoading(false);
  };

  const loadFriends = async () => {
    const response = await friendsService.getFriends();
    if (response.success && response.data) {
      setFriends(response.data.friends);
    }
  };

  const loadPendingRequests = async () => {
    const response = await friendsService.getPendingRequests();
    if (response.success && response.data) {
      setPendingRequests(response.data.requests);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    const response = await friendsService.acceptFriendRequest(friendshipId);
    setActionInProgress(null);

    if (response.success) {
      Alert.alert('Success', 'Friend request accepted!');
      // Reload data to update lists
      await loadData();
    } else {
      Alert.alert('Error', response.error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(friendshipId);
            const response = await friendsService.rejectFriendRequest(friendshipId);
            setActionInProgress(null);

            if (response.success) {
              // Remove from pending requests
              setPendingRequests((prev) =>
                prev.filter((req) => req.friendship_id !== friendshipId)
              );
            } else {
              Alert.alert('Error', response.error || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(friendshipId);
            const response = await friendsService.removeFriend(friendshipId);
            setActionInProgress(null);

            if (response.success) {
              // Remove from friends list
              setFriends((prev) =>
                prev.filter((friend) => friend.friendship_id !== friendshipId)
              );
            } else {
              Alert.alert('Error', response.error || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async (friend: FriendProfile) => {
    setActionInProgress(friend.friendship_id);
    const response = await chatService.createOrGetConversation(friend.id);
    setActionInProgress(null);

    if (response.success && response.data) {
      navigation.navigate('Chat', {
        conversationId: response.data.conversation.conversation_id,
        otherUserId: friend.id,
        otherUserName: friend.display_name || 'User',
        otherUserAvatar: friend.avatar_url || undefined,
      });
    } else {
      Alert.alert('Error', response.error || 'Failed to start chat');
    }
  };

  const renderFriendItem = ({ item }: { item: FriendProfile }) => {
    const isActionInProgress = actionInProgress === item.friendship_id;

    return (
      <View style={styles.listItem}>
        <View style={styles.itemContent}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.text.secondary} />
            </View>
          )}
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>
              {item.display_name || 'Anonymous'}
            </Text>
            <View style={styles.statsRow}>
              <Ionicons name="trophy" size={12} color={colors.primary} />
              <Text style={styles.statsText}>
                Level {item.level} • {item.xp} XP
              </Text>
            </View>
            {item.last_active_date && (
              <Text style={styles.lastActiveText}>
                Last active: {new Date(item.last_active_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.friendActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton, isActionInProgress && styles.buttonDisabled]}
            onPress={() => handleStartChat(item)}
            disabled={isActionInProgress}
          >
            <Ionicons name="chatbubble" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton, isActionInProgress && styles.buttonDisabled]}
            onPress={() => handleRemoveFriend(item.friendship_id, item.display_name)}
            disabled={isActionInProgress}
          >
            {isActionInProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="person-remove" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: PendingRequest }) => {
    const isActionInProgress = actionInProgress === item.friendship_id;

    return (
      <View style={styles.listItem}>
        <View style={styles.itemContent}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.text.secondary} />
            </View>
          )}
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>
              {item.display_name || 'Anonymous'}
            </Text>
            <View style={styles.statsRow}>
              <Ionicons name="trophy" size={12} color={colors.primary} />
              <Text style={styles.statsText}>
                Level {item.level} • {item.xp} XP
              </Text>
            </View>
            <Text style={styles.requestTime}>
              {getTimeAgo(new Date(item.requested_at))}
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, isActionInProgress && styles.buttonDisabled]}
            onPress={() => handleAcceptRequest(item.friendship_id)}
            disabled={isActionInProgress}
          >
            {isActionInProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, isActionInProgress && styles.buttonDisabled]}
            onPress={() => handleRejectRequest(item.friendship_id)}
            disabled={isActionInProgress}
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'friends') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Friends Yet</Text>
          <Text style={styles.emptyText}>
            Search for users and send friend requests to connect!
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptyText}>
            You don't have any friend requests at the moment
          </Text>
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}
          >
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}
          >
            Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'friends' ? friends : pendingRequests}
        renderItem={
          activeTab === 'friends' ? renderFriendItem : renderRequestItem
        }
        keyExtractor={(item) =>
          'friendship_id' in item ? item.friendship_id : item.id
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Helper function to get time ago
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#FFF',
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  listItem: {
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
  itemContent: {
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
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statsText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  lastActiveText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  requestTime: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  messageButton: {
    backgroundColor: colors.primary,
  },
  removeButton: {
    backgroundColor: colors.text.tertiary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
