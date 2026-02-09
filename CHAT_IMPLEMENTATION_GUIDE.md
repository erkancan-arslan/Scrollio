# Chat Implementation Guide for Scrollio

## 📋 Overview

This guide outlines how to implement a real-time chat system between friends in Scrollio using Supabase for messaging and Firebase Cloud Messaging (FCM) for push notifications.

---

## 🏗️ Architecture Decision

### Messaging: Supabase Realtime ✅
**Why:**
- Already using Supabase
- Built-in real-time subscriptions
- PostgreSQL for reliable message storage
- Row Level Security for privacy
- No additional service needed

### Notifications: Firebase Cloud Messaging (FCM) ✅
**Why:**
- **FREE up to unlimited messages** (Google changed policy in 2024)
- Most reliable push notification service
- Works seamlessly with Expo
- Supports iOS and Android
- Rich notification features (images, actions, etc.)
- Better delivery rates than alternatives

**Cost Comparison:**
- **FCM**: FREE forever (no limits)
- Expo Push Notifications: FREE for < 1M messages/month, then $0.50 per 1,000
- OneSignal: FREE for < 10K subscribers, then paid plans
- AWS SNS: Pay per notification (~$0.50 per million)

**Winner: Firebase FCM** - It's free, reliable, and well-supported.

---

## 📊 Database Schema (Supabase)

### 1. `conversations` Table

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_sender_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

### 2. `conversation_participants` Table

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
```

### 3. `messages` Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  media_url TEXT,
  thumbnail_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

### 4. `message_read_receipts` Table (Optional - for "seen" indicators)

```sql
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Index
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
```

### 5. `fcm_tokens` Table (For Firebase Notifications)

```sql
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);
```

---

## 🔐 Row Level Security (RLS) Policies

### For `conversations`:

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see conversations they're in
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );
```

### For `conversation_participants`:

```sql
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );
```

### For `messages`:

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Read messages in your conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Send messages in your conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Edit your own messages
CREATE POLICY "Users can edit own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Delete your own messages
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);
```

### For `fcm_tokens`:

```sql
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own FCM tokens"
  ON fcm_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔧 Database Functions (Postgres)

### Function: Get or Create Direct Conversation

```sql
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  friendship_status TEXT;
BEGIN
  -- Check if users are friends
  SELECT status INTO friendship_status
  FROM friendships
  WHERE (user_id = user1_id AND friend_id = user2_id)
     OR (user_id = user2_id AND friend_id = user1_id)
  LIMIT 1;
  
  IF friendship_status != 'accepted' THEN
    RAISE EXCEPTION 'Users must be friends to chat';
  END IF;
  
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  );
  
  -- If exists, return it
  IF conversation_id IS NOT NULL THEN
    RETURN conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (type) VALUES ('direct')
  RETURNING id INTO conversation_id;
  
  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function: Get Unread Message Count

```sql
CREATE OR REPLACE FUNCTION get_unread_message_count(requesting_user_id UUID)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(*)::BIGINT as unread_count
  FROM messages m
  JOIN conversation_participants cp 
    ON cp.conversation_id = m.conversation_id
    AND cp.user_id = requesting_user_id
  WHERE m.created_at > cp.last_read_at
    AND m.sender_id != requesting_user_id
  GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function: Mark Conversation as Read

```sql
CREATE OR REPLACE FUNCTION mark_conversation_read(
  requesting_user_id UUID,
  conv_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE user_id = requesting_user_id
  AND conversation_id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔔 Firebase Cloud Messaging (FCM) Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Add your Android app (package name from `app.json`)
4. Add your iOS app (bundle ID from `app.json`)
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### Step 2: Install Dependencies (Mobile App)

```bash
cd code/mobile-app
npm install @react-native-firebase/app @react-native-firebase/messaging
npx expo install expo-notifications
```

### Step 3: Configure Expo for FCM

Update `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF8C42"
        }
      ]
    ]
  }
}
```

### Step 4: Backend - Install Firebase Admin SDK

```bash
cd code/backend
npm install firebase-admin
```

### Step 5: Backend - Initialize Firebase Admin

Create `src/firebase/firebase-admin.service.ts`:

```typescript
import * as admin from 'firebase-admin';

// Download service account key from Firebase Console
// Store it securely (environment variables or secure vault)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const messaging = admin.messaging();
```

---

## 🚀 Backend API Endpoints

### Conversations

**GET** `/api/v1/conversations`
- Get user's conversation list
- Returns: conversations with last message, unread count, participant info

**POST** `/api/v1/conversations`
- Create conversation (checks friendship)
- Body: `{ friendId: string }`
- Returns: conversation ID

**GET** `/api/v1/conversations/:id`
- Get conversation details
- Returns: conversation info with participants

**DELETE** `/api/v1/conversations/:id`
- Leave conversation

### Messages

**GET** `/api/v1/conversations/:id/messages`
- Get messages (paginated)
- Query params: `limit`, `cursor` (last message ID)
- Returns: messages array

**POST** `/api/v1/conversations/:id/messages`
- Send message
- Body: `{ content: string, messageType: 'text' | 'image', mediaUrl?: string }`
- **Triggers FCM notification to recipient**
- Returns: created message

**PATCH** `/api/v1/messages/:id`
- Edit message
- Body: `{ content: string }`
- Returns: updated message

**DELETE** `/api/v1/messages/:id`
- Delete/soft-delete message
- Returns: success

**POST** `/api/v1/conversations/:id/read`
- Mark conversation as read
- Updates `last_read_at`

### FCM Tokens

**POST** `/api/v1/fcm/register`
- Register FCM token
- Body: `{ token: string, deviceId: string, deviceType: 'ios' | 'android' }`
- Returns: success

**DELETE** `/api/v1/fcm/unregister`
- Remove FCM token (on logout)
- Body: `{ token: string }`
- Returns: success

---

## 📱 Mobile App Implementation

### 1. FCM Token Registration

```typescript
// On app startup and after login
import messaging from '@react-native-firebase/messaging';

async function registerFCMToken() {
  // Request permission
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  
  if (enabled) {
    // Get FCM token
    const token = await messaging().getToken();
    
    // Send to backend
    await apiClient.post('/fcm/register', {
      token,
      deviceId: Device.deviceId,
      deviceType: Platform.OS,
    });
  }
}
```

### 2. Handle Foreground Notifications

```typescript
// Listen for messages when app is in foreground
messaging().onMessage(async remoteMessage => {
  // Show in-app notification or update chat UI
  console.log('Foreground message:', remoteMessage);
  
  if (remoteMessage.data?.conversationId) {
    // Update conversation list
    // Or add message to active chat
  }
});
```

### 3. Handle Background/Quit Notifications

```typescript
// Handle notification tap when app is in background/quit
messaging().onNotificationOpenedApp(remoteMessage => {
  // Navigate to conversation
  const conversationId = remoteMessage.data?.conversationId;
  if (conversationId) {
    navigation.navigate('Chat', { conversationId });
  }
});

// Check if app was opened from notification (quit state)
messaging().getInitialNotification().then(remoteMessage => {
  if (remoteMessage) {
    const conversationId = remoteMessage.data?.conversationId;
    // Navigate after app is ready
  }
});
```

### 4. Supabase Realtime Subscriptions

```typescript
// Subscribe to new messages in active conversation
const channel = supabase
  .channel(`conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Add new message to chat
      const newMessage = payload.new;
      setMessages(prev => [...prev, newMessage]);
    }
  )
  .subscribe();

// Cleanup on unmount
return () => {
  supabase.removeChannel(channel);
};
```

---

## 🔔 Backend FCM Notification Service

### Send Notification When Message is Created

```typescript
import { messaging } from '../firebase/firebase-admin.service';

async function sendMessageNotification(
  message: Message,
  sender: Profile,
  recipientUserId: string
) {
  // Get recipient's FCM tokens
  const { data: tokens } = await supabase
    .from('fcm_tokens')
    .select('token')
    .eq('user_id', recipientUserId);
  
  if (!tokens || tokens.length === 0) return;
  
  // Check if notifications are enabled for this conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('notifications_enabled, is_muted')
    .eq('conversation_id', message.conversation_id)
    .eq('user_id', recipientUserId)
    .single();
  
  if (!participant?.notifications_enabled || participant?.is_muted) {
    return;
  }
  
  // Prepare notification
  const notification = {
    title: sender.displayName || 'New Message',
    body: message.content?.substring(0, 100) || 'Sent a message',
  };
  
  const data = {
    conversationId: message.conversation_id,
    messageId: message.id,
    type: 'chat_message',
  };
  
  // Send to all recipient's devices
  const fcmTokens = tokens.map(t => t.token);
  
  try {
    await messaging.sendEachForMulticast({
      tokens: fcmTokens,
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to send FCM notification:', error);
    
    // Remove invalid tokens
    if (error.code === 'messaging/invalid-registration-token') {
      // Clean up invalid tokens from database
    }
  }
}
```

---

## 🎨 Frontend Components

### ChatListScreen

**Features:**
- List of conversations
- Last message preview
- Unread count badge
- User avatar
- Timestamp
- Pull to refresh
- Navigate to ChatScreen on tap

### ChatScreen

**Features:**
- Inverted FlatList (newest at bottom)
- Message bubbles (sender on right, receiver on left)
- Avatar for receiver messages
- Timestamps
- Message input at bottom (with KeyboardAvoidingView)
- Send button
- Real-time message updates
- Mark as read when viewing
- Load more messages on scroll up (pagination)

### MessageBubble Component

**Props:**
- `message` - Message object
- `isSender` - Boolean
- `showAvatar` - Boolean
- `showTimestamp` - Boolean

**Styling:**
- Sender: Right-aligned, primary color background
- Receiver: Left-aligned, gray background
- Rounded corners
- Timestamp below bubble
- Avatar for receiver

---

## 📝 Redux State Management

```typescript
interface ChatState {
  conversations: Conversation[];
  conversationsLoading: boolean;
  activeConversationId: string | null;
  messages: {
    [conversationId: string]: Message[];
  };
  messagesLoading: boolean;
  totalUnreadCount: number;
}
```

**Actions:**
- `fetchConversations` - Load conversation list
- `fetchMessages` - Load messages for conversation
- `sendMessage` - Send new message
- `markConversationRead` - Update read status
- `addMessage` - Add message from real-time subscription

---

## ⚡ Performance Optimizations

### 1. Message Pagination
- Load 50 messages at a time
- Use cursor-based pagination (last message ID)
- Load older messages as user scrolls up

### 2. Real-time Optimization
- Only subscribe to active conversation
- Unsubscribe when leaving chat
- Use throttling for typing indicators

### 3. Notification Optimization
- Batch notifications if multiple messages arrive quickly
- Don't send notification if user is actively in the chat
- Clean up old/invalid FCM tokens regularly

### 4. Database Optimization
- Index on `conversation_id` + `created_at` for fast message queries
- Use `last_read_at` for efficient unread count
- Archive old conversations (optional)

---

## 💰 Cost Analysis

### Supabase (Database + Realtime):
- **Free tier**: Up to 500 MB database, 2 GB bandwidth, 200 concurrent connections
- **Pro tier ($25/month)**: 8 GB database, 50 GB bandwidth, 500 concurrent
- Realtime included in all tiers

### Firebase FCM:
- **FREE unlimited** notifications (no longer metered)
- No hidden costs

### Supabase Storage (for images/media):
- **Free tier**: 1 GB storage, 2 GB bandwidth
- **Pro tier**: 100 GB storage, 200 GB bandwidth

### Estimated Monthly Cost for 10,000 Users:
- Supabase Pro: $25/month
- FCM: $0 (FREE)
- **Total: $25/month** (extremely affordable!)

---

## 🎯 Implementation Phases

### Phase 1: MVP (2-3 weeks)
1. Database schema + RLS policies
2. Backend API (conversations, messages)
3. ChatListScreen - display conversations
4. ChatScreen - send/receive text messages
5. Basic real-time with Supabase
6. FCM setup + basic notifications

### Phase 2: Enhanced UX (1-2 weeks)
7. Unread count badges
8. Read receipts ("seen")
9. Typing indicators
10. Message timestamps
11. Better loading states
12. Pull to refresh

### Phase 3: Media & Advanced (2-3 weeks)
13. Image sharing
14. Edit/delete messages
15. Message search
16. Mute conversations
17. Rich notifications (with images)
18. Notification settings per conversation

---

## 🐛 Edge Cases to Handle

1. **Unfriended during chat** - Disable sending, show warning
2. **Network offline** - Queue messages, show pending state
3. **Message send failure** - Show error, allow retry
4. **Invalid FCM tokens** - Clean up expired tokens
5. **Duplicate notifications** - Use notification IDs
6. **Time zones** - Store UTC, display local time
7. **Long messages** - Add character limit (e.g., 2000)
8. **Empty conversations** - Show "Start chatting" message
9. **Blocked users** - Prevent message sending
10. **App in foreground** - Don't show push notification

---

## ✅ Testing Checklist

### Functional Testing:
- [ ] Send text message
- [ ] Receive message in real-time
- [ ] Message appears in conversation list
- [ ] Unread count updates correctly
- [ ] Mark as read works
- [ ] Push notification received (background)
- [ ] Tap notification opens correct chat
- [ ] Create new conversation with friend
- [ ] Cannot chat with non-friends
- [ ] Message pagination works
- [ ] Edit message
- [ ] Delete message

### Performance Testing:
- [ ] Load 1000 messages smoothly
- [ ] Real-time updates don't lag
- [ ] Notifications arrive within 1-2 seconds
- [ ] App works offline (shows queued messages)

### Security Testing:
- [ ] Cannot see other users' conversations
- [ ] Cannot send messages in conversations not in
- [ ] Cannot edit others' messages
- [ ] RLS policies enforced

---

## 🚀 Quick Start Steps

1. **Run SQL migrations** - Create tables in Supabase
2. **Setup Firebase project** - Get FCM credentials
3. **Backend**: Add Firebase Admin SDK and notification service
4. **Mobile**: Install FCM dependencies
5. **Mobile**: Register FCM token on login
6. **Backend**: Add API endpoints for conversations/messages
7. **Mobile**: Build ChatListScreen
8. **Mobile**: Build ChatScreen
9. **Backend**: Trigger FCM notification on message creation
10. **Test**: Send messages between two devices

---

## 📚 Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Gifted Chat (Pre-built UI)](https://github.com/FaridSafi/react-native-gifted-chat)

---

## 🎉 Summary

**Best Path for Scrollio:**
- ✅ **Supabase** for messaging (real-time, database, security)
- ✅ **Firebase FCM** for notifications (free, reliable, easy)
- ✅ **Total cost: ~$25/month** (Supabase Pro tier)
- ✅ **Scalable** to hundreds of thousands of users
- ✅ **Easy to implement** with existing stack

This approach gives you professional-grade chat functionality at minimal cost with maximum reliability. Start with Phase 1 MVP and iterate from there!

Ready to implement? Let me know when you want to start building! 🚀
