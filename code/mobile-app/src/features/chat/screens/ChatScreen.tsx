/**
 * ChatScreen
 * Individual conversation screen with messages
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useRoute,
  useNavigation,
  RouteProp,
  useIsFocused,
  NavigationProp,
} from '@react-navigation/native';
import { chatService, Message, SharedPostMetadata } from '../../../services/chat';
import { supabase } from '../../../services/supabase/client';
import { colors } from '../../../theme/colors';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavProp = NavigationProp<RootStackParamList>;

/**
 * Append a message to the list, deduplicating by id and keeping the list
 * sorted by `created_at`. Used by both the optimistic post-send path and the
 * realtime INSERT handler so the two can race without producing duplicate
 * keys (which crashes FlatList rendering).
 */
const upsertMessage = (prev: Message[], incoming: Message): Message[] => {
  const idx = prev.findIndex((m) => m.id === incoming.id);
  if (idx >= 0) {
    const next = prev.slice();
    next[idx] = { ...prev[idx], ...incoming };
    return next;
  }
  // Newest message usually goes at the end; only sort when it would land
  // out of order to avoid disturbing scroll position for the common case.
  const last = prev[prev.length - 1];
  if (!last || new Date(incoming.created_at).getTime() >= new Date(last.created_at).getTime()) {
    return [...prev, incoming];
  }
  return [...prev, incoming].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
};

/**
 * Merge two arrays of messages by id, preserving relative order. Used when
 * paginating older messages so an overlapping cursor doesn't introduce
 * duplicate keys.
 */
const mergeMessages = (older: Message[], current: Message[]): Message[] => {
  const seen = new Set<string>();
  const out: Message[] = [];
  for (const m of older) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  for (const m of current) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
};

/**
 * Read the shared-post payload off a `message_type === 'post'` message.
 * Falls back to `media_url` (where we stash the videoId) if metadata is
 * missing — older clients or migrations without metadata still get a
 * tappable card.
 */
const readSharedPost = (item: Message): SharedPostMetadata | null => {
  if (item.message_type !== 'post') return null;
  const meta = (item.metadata || null) as SharedPostMetadata | null;
  const videoId = meta?.videoId || item.media_url || null;
  if (!videoId) return null;
  return {
    videoId,
    title: meta?.title || 'Shared video',
    creatorName: meta?.creatorName ?? null,
    creatorAvatar: meta?.creatorAvatar ?? null,
    duration: meta?.duration ?? null,
  };
};

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavProp>();
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);
  const messagesRef = useRef<Message[]>([]);

  const { conversationId, otherUserName, otherUserAvatar } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Configure header once
  useEffect(() => {
    navigation.setOptions({
      title: otherUserName || 'Chat',
      headerShown: true,
    });
  }, [navigation, otherUserName]);

  const markAsRead = useCallback(async () => {
    try {
      await chatService.markConversationAsRead(conversationId);
    } catch (err) {
      // Best effort — don't block UX
      console.warn('[ChatScreen] markConversationAsRead failed:', err);
    }
  }, [conversationId]);

  // Initial load + reload whenever the screen regains focus, so users don't
  // see a stale snapshot when returning to an existing conversation.
  useEffect(() => {
    if (!isFocused) return;
    loadMessages({ background: messagesRef.current.length > 0 });
    markAsRead();
    return () => {
      // Mark as read when leaving so the conversation list reflects it.
      markAsRead();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, conversationId]);

  // Realtime: subscribe to INSERT/UPDATE/DELETE on this conversation's messages.
  // Falls back gracefully if the publication isn't configured — the focus reload
  // and pull-to-refresh still keep the screen up to date.
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => upsertMessage(prev, incoming));
          markAsRead();
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 50);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, markAsRead]);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMessages = async (options: { background?: boolean } = {}) => {
    if (!options.background) {
      setIsLoading(true);
    }
    const response = await chatService.getMessages(conversationId);
    if (!options.background) {
      setIsLoading(false);
    }

    if (response.success && response.data) {
      setLoadError(null);
      // Messages come newest first, reverse for display (oldest at top)
      setMessages(response.data.messages.reverse());
      setHasMore(response.data.hasMore);
      setNextCursor(response.data.nextCursor);
    } else {
      const message = response.error || 'Failed to load messages';
      setLoadError(message);
      console.error('[ChatScreen] loadMessages failed:', message);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMessages({ background: true });
    setIsRefreshing(false);
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);
    const response = await chatService.getMessages(conversationId, 50, nextCursor);
    setIsLoadingMore(false);

    if (response.success && response.data) {
      // Prepend older messages (they come newest first, so reverse). Merge
      // by id so an overlapping cursor or a realtime-already-inserted row
      // doesn't produce duplicate keys.
      const older = response.data.messages.slice().reverse();
      setMessages((prev) => mergeMessages(older, prev));
      setHasMore(response.data.hasMore);
      setNextCursor(response.data.nextCursor);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);

    const response = await chatService.sendMessage(conversationId, text);
    setIsSending(false);

    if (response.success && response.data) {
      // Dedupe in case the realtime INSERT for this message has already
      // landed (very common now that the supabase client is authenticated
      // for realtime).
      setMessages((prev) => upsertMessage(prev, response.data!.message));

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      Alert.alert('Error', response.error || 'Failed to send message');
      setInputText(text); // Restore text on failure
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const openSharedPost = useCallback(
    (videoId: string) => {
      navigation.navigate('VideoPlayer', { videoId });
    },
    [navigation],
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // If sender is NOT the other user, then it's my message
    const isMyMessage = item.sender_id !== route.params.otherUserId;
    const showAvatar = !isMyMessage;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showTimestamp =
      !previousMessage ||
      new Date(item.created_at).getTime() -
        new Date(previousMessage.created_at).getTime() >
        300000; // 5 minutes

    const sharedPost = readSharedPost(item);

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {otherUserAvatar ? (
              <Image source={{ uri: otherUserAvatar }} style={styles.messageAvatar} />
            ) : (
              <View style={[styles.messageAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={16} color={colors.text.secondary} />
              </View>
            )}
          </View>
        )}

        {sharedPost ? (
          // Tappable video card. Uses an even darker bubble background so the
          // thumbnail stands out from regular text bubbles.
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openSharedPost(sharedPost.videoId)}
            style={[
              styles.postBubble,
              isMyMessage ? styles.myPostBubble : styles.theirPostBubble,
              !showAvatar && styles.messageBubbleNoAvatar,
            ]}
          >
            <View style={styles.postThumbWrap}>
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} style={styles.postThumb} />
              ) : (
                <View style={[styles.postThumb, styles.postThumbPlaceholder]}>
                  <Ionicons name="videocam" size={28} color="#FFF" />
                </View>
              )}
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={22} color="#FFF" />
              </View>
            </View>

            <View style={styles.postBody}>
              <Text style={styles.postLabel}>
                <Ionicons name="film-outline" size={11} color={colors.text.tertiary} />{' '}
                Shared a video
              </Text>
              <Text style={styles.postTitle} numberOfLines={2}>
                {sharedPost.title}
              </Text>
              {sharedPost.creatorName ? (
                <Text style={styles.postCreator} numberOfLines={1}>
                  {sharedPost.creatorName}
                </Text>
              ) : null}
              {item.content && item.content.trim().length > 0 ? (
                <Text
                  style={[
                    styles.postCaption,
                    isMyMessage ? styles.myMessageText : styles.theirMessageText,
                  ]}
                  numberOfLines={3}
                >
                  {item.content}
                </Text>
              ) : null}
              {showTimestamp && (
                <Text style={styles.messageTime}>{formatMessageTime(item.created_at)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
              !showAvatar && styles.messageBubbleNoAvatar,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
            {showTimestamp && (
              <Text style={styles.messageTime}>{formatMessageTime(item.created_at)}</Text>
            )}
            {item.is_edited && (
              <Text style={styles.editedLabel}>(edited)</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loadError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyText}>Couldn't load messages</Text>
          <Text style={styles.emptySubtext}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadMessages()}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={48} color={colors.text.secondary} />
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>Say hi to start the conversation!</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmptyState}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
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
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageBubbleNoAvatar: {
    marginLeft: 40, // Space for avatar
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: colors.text.primary,
  },
  messageTime: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  editedLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 20,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  postBubble: {
    maxWidth: '78%',
    width: 260,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  myPostBubble: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomRightRadius: 4,
  },
  theirPostBubble: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  postThumbWrap: {
    position: 'relative',
    backgroundColor: '#000',
  },
  postThumb: {
    width: '100%',
    aspectRatio: 9 / 12,
    backgroundColor: '#000',
  },
  postThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -22,
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBody: {
    padding: 12,
  },
  postLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  postCreator: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 8,
    color: colors.text.primary,
  },
});
