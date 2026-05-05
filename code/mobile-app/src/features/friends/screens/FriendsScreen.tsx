/**
 * Friends Screen
 * Shows friends list, pending requests (friend + duel), and sent requests.
 * Duel requests show countdown and accept/refuse buttons with realtime updates.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  SectionList,
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
import { duelService } from '../../playground/services/duelService';
import { supabase } from '../../../services/supabase/client';
import { colors } from '../../../theme/colors';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'friends' | 'requests';

// =====================================================
// Duel Request Item (from DB row)
// =====================================================
interface DuelRequestItem {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  expires_at: string;
  match_id: string | null;
  // Sender profile data (resolved by backend)
  sender_profile?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [duelRequests, setDuelRequests] = useState<DuelRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const [, forceUpdate] = useState(0); // For countdown re-renders

  // Get current user ID and then load all data
  useEffect(() => {
    const init = async () => {
      console.log('[FriendsScreen] init() starting...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[FriendsScreen] user:', user?.id || 'null');
      if (user) {
        setCurrentUserId(user.id);
        userIdRef.current = user.id;
        await loadDataWithUserId(user.id);
      } else {
        console.log('[FriendsScreen] No user found, skipping load');
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // =====================================================
  // Duel Request Realtime Subscription
  // =====================================================
  useEffect(() => {
    if (!currentUserId) return;

    duelService.subscribeToDuelRequestsViaDB(
      currentUserId,
      // On INSERT — new incoming duel request
      (record: DuelRequestItem) => {
        console.log('[FriendsScreen] RT INSERT:', JSON.stringify(record));
        if (record.status === 'pending' && record.to_user_id === currentUserId) {
          // Fetch profile for the sender
          loadDuelRequests();
        }
      },
      // On UPDATE — status change (accepted/rejected/expired/canceled)
      (record: DuelRequestItem) => {
        console.log('[FriendsScreen] RT UPDATE:', JSON.stringify(record));
        if (record.status === 'accepted' && record.match_id) {
          // Someone accepted — navigate to duel game
          handleDuelAccepted(record);
        } else if (record.status !== 'pending') {
          // Remove from list (rejected/expired/canceled)
          setDuelRequests((prev) => prev.filter((r) => r.id !== record.id));
        }
      },
    );

    return () => {
      duelService.unsubscribeFromDuelRequests();
    };
  }, [currentUserId]);

  // =====================================================
  // Countdown timer for duel requests
  // =====================================================
  useEffect(() => {
    if (duelRequests.length === 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // Remove expired requests from local state
      setDuelRequests((prev) => {
        const filtered = prev.filter((r) => new Date(r.expires_at).getTime() > now);
        if (filtered.length !== prev.length) return filtered;
        return prev;
      });
      // Force re-render for countdown display
      forceUpdate((v) => v + 1);
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [duelRequests.length]);

  // =====================================================
  // Data Loading
  // =====================================================
  const loadDataWithUserId = async (userId: string) => {
    setIsLoading(true);
    await Promise.all([loadFriends(), loadPendingRequests(), loadDuelRequests(userId)]);
    setIsLoading(false);
  };

  const loadData = async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    setIsLoading(true);
    await Promise.all([loadFriends(), loadPendingRequests(), loadDuelRequests(uid)]);
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

  const loadDuelRequests = async (userId?: string) => {
    const uid = userId || userIdRef.current;
    console.log('[FriendsScreen] loadDuelRequests uid:', uid);
    if (!uid) return;
    try {
      const result = await duelService.getPendingDuelRequests();
      console.log('[FriendsScreen] getPendingDuelRequests result:', JSON.stringify(result));
      // Filter to only show incoming requests (to_user_id = me)
      const incoming = (result.requests || []).filter(
        (r: DuelRequestItem) => r.to_user_id === uid && r.status === 'pending',
      );
      console.log('[FriendsScreen] filtered incoming duel requests:', incoming.length);
      setDuelRequests(incoming);
    } catch (err) {
      console.error('[FriendsScreen] loadDuelRequests error:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // =====================================================
  // Duel Request Handlers
  // =====================================================
  const handleDuelAccepted = (record: DuelRequestItem) => {
    if (!record.match_id || !currentUserId) return;

    // Remove from list
    setDuelRequests((prev) => prev.filter((r) => r.id !== record.id));

    // Navigate to DuelGame — sender (from_user_id) is always Player A
    const isPlayerA = record.from_user_id === currentUserId;
    const opponentName = record.sender_profile?.display_name || 'Opponent';
    const opponentAvatar = record.sender_profile?.avatar_url || null;

    navigation.navigate('DuelGame', {
      matchId: record.match_id,
      opponentName,
      opponentAvatar,
      role: isPlayerA ? 'A' : 'B',
      seed: 0, // Will be fetched from match state
      questionSetId: '',
      bankVersion: '',
      playerAId: record.from_user_id,
      playerBId: record.to_user_id,
    });
  };

  const handleAcceptDuel = async (request: DuelRequestItem) => {
    setActionInProgress(request.id);
    try {
      const result = await duelService.respondDuelRequest(request.id, 'accept');
      setActionInProgress(null);

      // Remove from local list
      setDuelRequests((prev) => prev.filter((r) => r.id !== request.id));

      if (result.matchId) {
        // Navigate to DuelGame
        const opponentName = request.sender_profile?.display_name || 'Opponent';
        const opponentAvatar = request.sender_profile?.avatar_url || null;

        navigation.navigate('DuelGame', {
          matchId: result.matchId,
          opponentName,
          opponentAvatar,
          role: 'B', // Acceptor is always player B
          seed: 0,
          questionSetId: '',
          bankVersion: '',
          playerAId: request.from_user_id,
          playerBId: request.to_user_id,
        });
      }
    } catch (err: any) {
      setActionInProgress(null);
      Alert.alert('Error', err.message || 'Failed to accept duel request');
    }
  };

  const handleRefuseDuel = async (request: DuelRequestItem) => {
    setActionInProgress(request.id);
    try {
      await duelService.respondDuelRequest(request.id, 'reject');
      setActionInProgress(null);
      // Remove from local list immediately
      setDuelRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: any) {
      setActionInProgress(null);
      Alert.alert('Error', err.message || 'Failed to refuse duel request');
    }
  };

  // =====================================================
  // Friend Request Handlers
  // =====================================================
  const handleAcceptRequest = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    const response = await friendsService.acceptFriendRequest(friendshipId);
    setActionInProgress(null);

    if (response.success) {
      Alert.alert('Success', 'Friend request accepted!');
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

  const handleChallengeToDuel = async (friend: FriendProfile) => {
    setActionInProgress(friend.friendship_id);
    try {
      const result = await duelService.createDuelRequest(friend.id);
      setActionInProgress(null);
      navigation.navigate('DuelLobby', {
        requestId: result.requestId,
        opponentName: friend.display_name || 'Opponent',
        opponentAvatar: friend.avatar_url || null,
        myUserId: currentUserId ?? '',
        opponentId: friend.id,
      });
    } catch (err: any) {
      setActionInProgress(null);
      Alert.alert('Error', err.message || 'Failed to send duel challenge');
    }
  };

  // =====================================================
  // Render Items
  // =====================================================
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
            style={[styles.actionButton, styles.duelButton, isActionInProgress && styles.buttonDisabled]}
            onPress={() => handleChallengeToDuel(item)}
            disabled={isActionInProgress}
          >
            <Ionicons name="flash" size={18} color="#FFF" />
          </TouchableOpacity>
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

  // =====================================================
  // Duel Request Card
  // =====================================================
  const renderDuelRequestItem = (request: DuelRequestItem) => {
    const isInProgress = actionInProgress === request.id;
    const expiresAt = new Date(request.expires_at).getTime();
    const remainingSec = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    const senderName = request.sender_profile?.display_name || 'Someone';
    const senderAvatar = request.sender_profile?.avatar_url;

    return (
      <View key={request.id} style={[styles.listItem, styles.duelRequestCard]}>
        <View style={styles.itemContent}>
          {senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="flash" size={24} color="#FFD700" />
            </View>
          )}
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{senderName}</Text>
            <Text style={styles.duelRequestLabel}>⚔️ Duel Challenge</Text>
            <Text style={[styles.countdownText, remainingSec <= 5 && styles.countdownUrgent]}>
              Expires in {remainingSec}s
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.duelAcceptButton, isInProgress && styles.buttonDisabled]}
            onPress={() => handleAcceptDuel(request)}
            disabled={isInProgress}
          >
            {isInProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.duelRefuseButton, isInProgress && styles.buttonDisabled]}
            onPress={() => handleRefuseDuel(request)}
            disabled={isInProgress}
          >
            <Ionicons name="close-circle" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =====================================================
  // Requests Tab Content
  // =====================================================
  const renderRequestsTab = () => {
    const hasDuelRequests = duelRequests.length > 0;
    const hasFriendRequests = pendingRequests.length > 0;

    if (!hasDuelRequests && !hasFriendRequests) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptyText}>
            You don't have any friend or duel requests at the moment
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {/* Duel Requests Section */}
        {hasDuelRequests && (
          <View>
            <Text style={styles.sectionHeader}>⚔️ Duel Challenges</Text>
            {duelRequests.map(renderDuelRequestItem)}
          </View>
        )}

        {/* Friend Requests Section */}
        {hasFriendRequests && (
          <View>
            <Text style={styles.sectionHeader}>👋 Friend Requests</Text>
            {pendingRequests.map((item) => (
              <View key={item.friendship_id}>
                {renderRequestItem({ item })}
              </View>
            ))}
          </View>
        )}
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
    }
    return null;
  };

  const totalRequestCount = pendingRequests.length + duelRequests.length;

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
            Requests ({totalRequestCount})
          </Text>
          {totalRequestCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalRequestCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'friends' ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.friendship_id}
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
      ) : (
        <FlatList
          data={[{ key: 'requests' }]}
          renderItem={() => renderRequestsTab()}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 4,
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
  duelRequestCard: {
    borderColor: '#FFD70060',
    borderWidth: 1.5,
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
  duelRequestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 2,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  countdownUrgent: {
    color: colors.error,
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
  duelButton: {
    backgroundColor: '#FFD700',
  },
  duelAcceptButton: {
    backgroundColor: '#4CAF50',
  },
  duelRefuseButton: {
    backgroundColor: '#F44336',
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
