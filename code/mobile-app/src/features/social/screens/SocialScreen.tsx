/**
 * SocialScreen
 * Combined screen merging Friends list, Messages (chat list), and Requests into one tab.
 * Internal top-tab navigation with animated indicator.
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  friendsService,
  FriendProfile,
  PendingRequest,
  SentRequest,
} from '../../../services/friends';
import { chatService, Conversation } from '../../../services/chat';
import { duelService } from '../../playground/services/duelService';
import { supabase, syncSupabaseSessionFromStorage } from '../../../services/supabase/client';
import { secureStorage } from '../../../services/storage/secureStorage';
import { colors } from '../../../theme/colors';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SocialTab = 'friends' | 'messages' | 'requests';

interface DuelRequestItem {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  expires_at: string;
  match_id: string | null;
  sender_profile?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SocialScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  // Tab state
  const [activeTab, setActiveTab] = useState<SocialTab>('friends');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Friends data
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [duelRequests, setDuelRequests] = useState<DuelRequestItem[]>([]);

  // Messages data
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Shared
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const [, forceUpdate] = useState(0);

  const TABS: { key: SocialTab; label: string }[] = [
    { key: 'friends', label: 'Friends' },
    { key: 'messages', label: 'Messages' },
    { key: 'requests', label: 'Requests' },
  ];

  const tabWidth = SCREEN_WIDTH / TABS.length;

  const switchTab = (tab: SocialTab) => {
    const index = TABS.findIndex((t) => t.key === tab);
    Animated.spring(indicatorAnim, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setActiveTab(tab);
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
  // The app signs users in via the backend REST endpoint and only persists the
  // session to `secureStorage`. The Supabase JS client is therefore *not*
  // automatically aware of who is signed in on a fresh device, which is why
  // `supabase.auth.getUser()` was silently returning null on a friend's phone
  // (and consequently friends/conversations/requests never loaded).
  //
  // We resolve the current user id from `secureStorage` (the real source of
  // truth) and, in parallel, push the session into the Supabase client so that
  // realtime subscriptions can authenticate against RLS.
  useEffect(() => {
    const init = async () => {
      try {
        const [{ userId }] = await Promise.all([
          secureStorage.getSession(),
          syncSupabaseSessionFromStorage(),
        ]);

        if (userId) {
          setCurrentUserId(userId);
          userIdRef.current = userId;
          await loadAll(userId);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[SocialScreen] init error:', error);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Reload all data when screen is focused (friends, conversations, requests).
  // Without this, accepting a friend request elsewhere or returning from a chat
  // would show a stale list until the next manual refresh.
  useEffect(() => {
    if (isFocused && currentUserId) {
      loadFriends();
      loadPendingRequests();
      loadSentRequests();
      loadConversations();
    }
  }, [isFocused, currentUserId]);

  // Realtime: react to friendship changes (accepted by counterpart, removed,
  // new incoming request) so the lists update instantly without a refresh.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`friendships:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          loadFriends();
          loadPendingRequests();
          loadSentRequests();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${currentUserId}`,
        },
        () => {
          loadFriends();
          loadPendingRequests();
          loadSentRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Realtime: react to new conversations / new messages so the messages tab
  // updates immediately when a friend starts a chat or sends a message.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`social-conversations:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // ─── Duel realtime subscription ───────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    duelService.subscribeToDuelRequestsViaDB(
      currentUserId,
      (record: DuelRequestItem) => {
        if (record.status === 'pending' && record.to_user_id === currentUserId) {
          loadDuelRequests();
        }
      },
      (record: DuelRequestItem) => {
        if (record.status === 'accepted' && record.match_id) {
          handleDuelAccepted(record);
        } else if (record.status !== 'pending') {
          setDuelRequests((prev) => prev.filter((r) => r.id !== record.id));
        }
      },
    );

    return () => {
      duelService.unsubscribeFromDuelRequests();
    };
  }, [currentUserId]);

  // ─── Countdown ────────────────────────────────────────────────────────────
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
      setDuelRequests((prev) => {
        const filtered = prev.filter((r) => new Date(r.expires_at).getTime() > now);
        if (filtered.length !== prev.length) return filtered;
        return prev;
      });
      forceUpdate((v) => v + 1);
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [duelRequests.length]);

  // ─── Data Loading ─────────────────────────────────────────────────────────
  const loadAll = async (userId: string) => {
    setIsLoading(true);
    await Promise.all([
      loadFriends(),
      loadPendingRequests(),
      loadSentRequests(),
      loadDuelRequests(userId),
      loadConversations(),
    ]);
    setIsLoading(false);
  };

  const loadData = async (options: { background?: boolean } = {}) => {
    const uid = userIdRef.current;
    if (!uid) return;
    if (!options.background) {
      setIsLoading(true);
    }
    await Promise.all([
      loadFriends(),
      loadPendingRequests(),
      loadSentRequests(),
      loadDuelRequests(uid),
      loadConversations(),
    ]);
    if (!options.background) {
      setIsLoading(false);
    }
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

  const loadSentRequests = async () => {
    const response = await friendsService.getSentRequests();
    if (response.success && response.data) {
      setSentRequests(response.data.requests);
    }
  };

  const loadDuelRequests = async (userId?: string) => {
    const uid = userId || userIdRef.current;
    if (!uid) return;
    try {
      const result = await duelService.getPendingDuelRequests();
      const incoming = (result.requests || []).filter(
        (r: DuelRequestItem) => r.to_user_id === uid && r.status === 'pending',
      );
      setDuelRequests(incoming);
    } catch (err) {
      console.error('[SocialScreen] loadDuelRequests error:', err);
    }
  };

  const loadConversations = async () => {
    const response = await chatService.getConversations();
    if (response.success && response.data) {
      setConversations(response.data.conversations);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData({ background: true });
    setIsRefreshing(false);
  };

  // ─── Duel Handlers ────────────────────────────────────────────────────────
  const handleDuelAccepted = (record: DuelRequestItem) => {
    if (!record.match_id || !currentUserId) return;
    setDuelRequests((prev) => prev.filter((r) => r.id !== record.id));
    const isPlayerA = record.from_user_id !== currentUserId;
    navigation.navigate('DuelGame', {
      matchId: record.match_id,
      opponentName: record.sender_profile?.display_name || 'Opponent',
      opponentAvatar: record.sender_profile?.avatar_url || null,
      role: isPlayerA ? 'A' : 'B',
      seed: 0,
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
      setDuelRequests((prev) => prev.filter((r) => r.id !== request.id));
      if (result.matchId) {
        navigation.navigate('DuelGame', {
          matchId: result.matchId,
          opponentName: request.sender_profile?.display_name || 'Opponent',
          opponentAvatar: request.sender_profile?.avatar_url || null,
          role: 'B',
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
      setDuelRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: any) {
      setActionInProgress(null);
      Alert.alert('Error', err.message || 'Failed to refuse duel request');
    }
  };

  // ─── Friend Handlers ──────────────────────────────────────────────────────
  const handleAcceptRequest = async (friendshipId: string) => {
    setActionInProgress(friendshipId);
    const response = await friendsService.acceptFriendRequest(friendshipId);
    setActionInProgress(null);
    if (response.success) {
      // Optimistically remove the request from the local list so the user
      // sees an immediate transition without a full-screen loading flash.
      setPendingRequests((prev) =>
        prev.filter((req) => req.friendship_id !== friendshipId),
      );
      Alert.alert('Success', 'Friend request accepted!');
      await loadData({ background: true });
    } else {
      Alert.alert('Error', response.error || 'Failed to accept request');
    }
  };

  const handleCancelSentRequest = (friendshipId: string, displayName: string) => {
    Alert.alert(
      'Cancel Request',
      `Cancel your friend request to ${displayName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(friendshipId);
            const response = await friendsService.removeFriend(friendshipId);
            setActionInProgress(null);
            if (response.success) {
              setSentRequests((prev) =>
                prev.filter((req) => req.friendship_id !== friendshipId),
              );
            } else {
              Alert.alert('Error', response.error || 'Failed to cancel request');
            }
          },
        },
      ],
    );
  };

  const handleRejectRequest = async (friendshipId: string) => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this friend request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionInProgress(friendshipId);
          const response = await friendsService.rejectFriendRequest(friendshipId);
          setActionInProgress(null);
          if (response.success) {
            setPendingRequests((prev) => prev.filter((req) => req.friendship_id !== friendshipId));
          } else {
            Alert.alert('Error', response.error || 'Failed to reject request');
          }
        },
      },
    ]);
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    Alert.alert('Remove Friend', `Are you sure you want to remove ${friendName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setActionInProgress(friendshipId);
          const response = await friendsService.removeFriend(friendshipId);
          setActionInProgress(null);
          if (response.success) {
            setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId));
          } else {
            Alert.alert('Error', response.error || 'Failed to remove friend');
          }
        },
      },
    ]);
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
      });
    } catch (err: any) {
      setActionInProgress(null);
      Alert.alert('Error', err.message || 'Failed to send duel challenge');
    }
  };

  // ─── Conversation Handlers ────────────────────────────────────────────────
  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat' as any, {
      conversationId: conversation.conversation_id,
      otherUserId: conversation.other_user_id,
      otherUserName: conversation.other_user_display_name || 'User',
      otherUserAvatar: conversation.other_user_avatar_url,
    });
  };

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  // ─── Render: Friends Tab ──────────────────────────────────────────────────
  const renderFriendItem = ({ item }: { item: FriendProfile }) => {
    const inProgress = actionInProgress === item.friendship_id;
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
            <Text style={styles.itemName}>{item.display_name || 'Anonymous'}</Text>
            <View style={styles.statsRow}>
              <Ionicons name="trophy" size={12} color={colors.primary} />
              <Text style={styles.statsText}>Level {item.level} • {item.xp} XP</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.duelBtn, inProgress && styles.btnDisabled]}
            onPress={() => handleChallengeToDuel(item)}
            disabled={inProgress}
          >
            <Ionicons name="flash" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.msgBtn, inProgress && styles.btnDisabled]}
            onPress={() => handleStartChat(item)}
            disabled={inProgress}
          >
            <Ionicons name="chatbubble" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.removeBtn, inProgress && styles.btnDisabled]}
            onPress={() => handleRemoveFriend(item.friendship_id, item.display_name)}
            disabled={inProgress}
          >
            {inProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="person-remove" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Render: Messages Tab ─────────────────────────────────────────────────
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.conversationItem} onPress={() => handleConversationPress(item)}>
      <View style={styles.convContent}>
        {item.other_user_avatar_url ? (
          <Image source={{ uri: item.other_user_avatar_url }} style={styles.convAvatar} />
        ) : (
          <View style={[styles.convAvatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={colors.text.secondary} />
          </View>
        )}
        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text style={styles.convName} numberOfLines={1}>
              {item.other_user_display_name || 'User'}
            </Text>
            {item.last_message_at && (
              <Text style={styles.convTime}>{formatTimestamp(item.last_message_at)}</Text>
            )}
          </View>
          <View style={styles.convMsgRow}>
            <Text
              style={[styles.convLastMsg, item.unread_count > 0 && styles.unreadMsg]}
              numberOfLines={1}
            >
              {item.last_message_preview || 'No messages yet'}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Render: Requests Tab ─────────────────────────────────────────────────
  const renderRequestItem = ({ item }: { item: PendingRequest }) => {
    const inProgress = actionInProgress === item.friendship_id;
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
            <Text style={styles.itemName}>{item.display_name || 'Anonymous'}</Text>
            <Text style={styles.requestTime}>{getTimeAgo(new Date(item.requested_at))}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.acceptBtn, inProgress && styles.btnDisabled]}
            onPress={() => handleAcceptRequest(item.friendship_id)}
            disabled={inProgress}
          >
            {inProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.rejectBtn, inProgress && styles.btnDisabled]}
            onPress={() => handleRejectRequest(item.friendship_id)}
            disabled={inProgress}
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentRequestItem = ({ item }: { item: SentRequest }) => {
    const inProgress = actionInProgress === item.friendship_id;
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
            <Text style={styles.itemName}>{item.display_name || 'Anonymous'}</Text>
            <View style={styles.statsRow}>
              <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
              <Text style={styles.requestTime}>
                Pending • Sent {getTimeAgo(new Date(item.requested_at))}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.rejectBtn, inProgress && styles.btnDisabled]}
            onPress={() => handleCancelSentRequest(item.friendship_id, item.display_name)}
            disabled={inProgress}
          >
            {inProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="close" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDuelItem = (request: DuelRequestItem) => {
    const inProgress = actionInProgress === request.id;
    const remainingSec = Math.max(
      0,
      Math.ceil((new Date(request.expires_at).getTime() - Date.now()) / 1000),
    );
    const senderName = request.sender_profile?.display_name || 'Someone';
    const senderAvatar = request.sender_profile?.avatar_url;

    return (
      <View key={request.id} style={[styles.listItem, styles.duelCard]}>
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
            <Text style={styles.duelLabel}>⚔️ Duel Challenge</Text>
            <Text style={[styles.countdown, remainingSec <= 5 && styles.countdownUrgent]}>
              Expires in {remainingSec}s
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: '#4CAF50' }, inProgress && styles.btnDisabled]}
            onPress={() => handleAcceptDuel(request)}
            disabled={inProgress}
          >
            {inProgress ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: '#F44336' }, inProgress && styles.btnDisabled]}
            onPress={() => handleRefuseDuel(request)}
            disabled={inProgress}
          >
            <Ionicons name="close-circle" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Content ──────────────────────────────────────────────────────────────
  const totalRequestCount = pendingRequests.length + duelRequests.length;

  const renderTabContent = () => {
    const refreshControl = (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
      />
    );

    if (activeTab === 'friends') {
      return (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.friendship_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyTitle}>No Friends Yet</Text>
              <Text style={styles.emptyText}>
                Search for users and send friend requests to connect!
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'messages') {
      return (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.conversation_id}
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyTitle}>No Conversations</Text>
              <Text style={styles.emptyText}>Start chatting with your friends!</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => switchTab('friends')}
              >
                <Ionicons name="people" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Go to Friends</Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    }

    // Requests tab
    return (
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <View>
            {duelRequests.length === 0 &&
            pendingRequests.length === 0 &&
            sentRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-open-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                <Text style={styles.emptyText}>
                  You don't have any friend or duel requests at the moment.
                </Text>
              </View>
            ) : (
              <>
                {duelRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>⚔️ Duel Challenges</Text>
                    {duelRequests.map(renderDuelItem)}
                  </>
                )}
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>👋 Friend Requests</Text>
                    {pendingRequests.map((item) => (
                      <View key={item.friendship_id}>{renderRequestItem({ item })}</View>
                    ))}
                  </>
                )}
                {sentRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>📤 Sent Requests</Text>
                    {sentRequests.map((item) => (
                      <View key={item.friendship_id}>
                        {renderSentRequestItem({ item })}
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </View>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Social</Text>
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
        <Text style={styles.headerTitle}>Social</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge =
            tab.key === 'requests' && totalRequestCount > 0 ? totalRequestCount : null;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, { width: tabWidth }]}
              onPress={() => switchTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {badge !== null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: tabWidth, transform: [{ translateX: indicatorAnim }] },
          ]}
        />
      </View>

      {/* Content */}
      {renderTabContent()}
    </SafeAreaView>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
    marginTop: 4,
  },

  // Friend / Request item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  duelCard: {
    borderColor: '#FFD70060',
    borderWidth: 1.5,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  requestTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  duelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 2,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  countdownUrgent: {
    color: colors.error,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duelBtn: { backgroundColor: '#FFD700' },
  msgBtn: { backgroundColor: colors.primary },
  removeBtn: { backgroundColor: colors.text.tertiary },
  acceptBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
  btnDisabled: { opacity: 0.6 },

  // Conversations
  conversationItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  convContent: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  convAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  convInfo: { flex: 1 },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  convMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convLastMsg: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  unreadMsg: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Loading / Empty
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
    paddingHorizontal: 32,
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
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    marginTop: 20,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
