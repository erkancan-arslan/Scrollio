/**
 * ShareToFriendsModal
 * Bottom-sheet modal for sharing a feed video to a friend via direct message.
 *
 * Loads the user's friends, lets them pick one (and optionally type a caption),
 * then calls `chatService.sharePostToFriend` which creates/gets the conversation
 * and posts a `message_type='post'` message containing the shared video.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video } from '../types';
import { friendsService, FriendProfile } from '../../../services/friends/friendsService';
import { chatService } from '../../../services/chat';
import { colors } from '../../../theme/colors';

interface ShareToFriendsModalProps {
  visible: boolean;
  video: Video | null;
  onClose: () => void;
  /** Called once a post is successfully shared. Useful for analytics / toasts. */
  onShared?: (friend: FriendProfile) => void;
}

export const ShareToFriendsModal: React.FC<ShareToFriendsModalProps> = ({
  visible,
  video,
  onClose,
  onShared,
}) => {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [search, setSearch] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reset transient state every time the modal is reopened so a previous
  // session's caption / "sent" check marks don't bleed into the next share.
  useEffect(() => {
    if (visible) {
      setCaption('');
      setSearch('');
      setSentTo(new Set());
      setSendingTo(null);
      void loadFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadFriends = async () => {
    setIsLoading(true);
    setLoadError(null);
    const res = await friendsService.getFriends();
    setIsLoading(false);

    if (res.success && res.data) {
      setFriends(res.data.friends || []);
    } else {
      setLoadError(res.error || 'Failed to load friends');
    }
  };

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends;
    const q = search.toLowerCase();
    return friends.filter((f) => f.display_name?.toLowerCase().includes(q));
  }, [friends, search]);

  const handleSend = async (friend: FriendProfile) => {
    if (!video) return;
    if (sendingTo) return;

    setSendingTo(friend.id);
    const res = await chatService.sharePostToFriend(friend.id, video, caption);
    setSendingTo(null);

    if (res.success) {
      setSentTo((prev) => {
        const next = new Set(prev);
        next.add(friend.id);
        return next;
      });
      onShared?.(friend);
    } else {
      Alert.alert('Could not share', res.error || 'Please try again.');
    }
  };

  const renderFriend = ({ item }: { item: FriendProfile }) => {
    const isSending = sendingTo === item.id;
    const isSent = sentTo.has(item.id);

    return (
      <View style={styles.friendRow}>
        <View style={styles.friendIdentity}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.friendAvatar} />
          ) : (
            <View style={[styles.friendAvatar, styles.friendAvatarPlaceholder]}>
              <Ionicons name="person" size={18} color={colors.text.secondary} />
            </View>
          )}
          <View style={styles.friendText}>
            <Text style={styles.friendName} numberOfLines={1}>
              {item.display_name || 'Anonymous'}
            </Text>
            <Text style={styles.friendMeta}>Lvl {item.level}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            isSent && styles.sendBtnSent,
            (isSending || (sendingTo && sendingTo !== item.id)) && styles.sendBtnDisabled,
          ]}
          disabled={isSending || isSent || sendingTo !== null}
          onPress={() => handleSend(item)}
          activeOpacity={0.85}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : isSent ? (
            <>
              <Ionicons name="checkmark" size={16} color="#FFF" />
              <Text style={styles.sendBtnText}>Sent</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={14} color="#FFF" />
              <Text style={styles.sendBtnText}>Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (loadError) {
      return (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
          <Text style={styles.emptyTitle}>Couldn't load friends</Text>
          <Text style={styles.emptySubtitle}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadFriends}>
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (search.trim() && filteredFriends.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={36} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No matches</Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Ionicons name="people-outline" size={36} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No friends yet</Text>
        <Text style={styles.emptySubtitle}>
          Add friends from the Social tab to share videos with them.
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Share to a friend</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {video && (
            <View style={styles.preview}>
              {video.thumbnailUrl ? (
                <Image source={{ uri: video.thumbnailUrl }} style={styles.previewThumb} />
              ) : (
                <View style={[styles.previewThumb, styles.previewThumbPlaceholder]}>
                  <Ionicons name="videocam" size={20} color={colors.text.secondary} />
                </View>
              )}
              <View style={styles.previewText}>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                {!!video.creator?.displayName && (
                  <Text style={styles.previewCreator} numberOfLines={1}>
                    {video.creator.displayName}
                  </Text>
                )}
              </View>
            </View>
          )}

          <TextInput
            style={styles.captionInput}
            placeholder="Add a message (optional)"
            placeholderTextColor={colors.text.tertiary}
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
            multiline
          />

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends"
              placeholderTextColor={colors.text.tertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={filteredFriends}
            keyExtractor={(f) => f.id}
            renderItem={renderFriend}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={
              filteredFriends.length === 0 ? styles.listEmpty : styles.listContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '85%',
    minHeight: '55%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.backgroundTertiary,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  previewThumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  previewThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
  },
  previewText: {
    flex: 1,
    marginLeft: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  previewCreator: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  captionInput: {
    marginTop: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 44,
    maxHeight: 100,
  },
  searchWrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  friendIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
  },
  friendAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendText: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  friendMeta: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
    minWidth: 76,
    justifyContent: 'center',
  },
  sendBtnSent: {
    backgroundColor: colors.success,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
    marginTop: 16,
  },
  retryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
