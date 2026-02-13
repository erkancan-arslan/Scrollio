/**
 * Presence Service
 * Manages user online/offline presence via Supabase Realtime.
 */

import { supabase } from '../../services/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

class PresenceService {
    private channel: RealtimeChannel | null = null;
    private onlineUsers: Set<string> = new Set();
    private listeners: Array<(onlineUserIds: string[]) => void> = [];

    /**
     * Start tracking presence for the current user.
     * Call on app foreground / auth login.
     */
    async trackPresence(userId: string): Promise<void> {
        if (this.channel) {
            // Already tracking
            return;
        }

        this.channel = supabase.channel('presence:online', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel?.presenceState() ?? {};
                this.onlineUsers = new Set(Object.keys(state));
                this.notifyListeners();
            })
            .on('presence', { event: 'join' }, ({ key }) => {
                if (key) {
                    this.onlineUsers.add(key);
                    this.notifyListeners();
                }
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                if (key) {
                    this.onlineUsers.delete(key);
                    this.notifyListeners();
                }
            });

        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await this.channel?.track({ user_id: userId, online_at: new Date().toISOString() });
            }
        });
    }

    /**
     * Stop tracking presence.
     * Call on app background / auth logout.
     */
    async untrackPresence(): Promise<void> {
        if (this.channel) {
            await this.channel.untrack();
            await supabase.removeChannel(this.channel);
            this.channel = null;
            this.onlineUsers.clear();
        }
    }

    /**
     * Check if a specific user is online.
     */
    isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }

    /**
     * Filter a list of user IDs to only those currently online.
     */
    getOnlineUsers(userIds: string[]): string[] {
        return userIds.filter((id) => this.onlineUsers.has(id));
    }

    /**
     * Get all currently online user IDs.
     */
    getAllOnlineUsers(): string[] {
        return Array.from(this.onlineUsers);
    }

    /**
     * Register a listener for presence changes.
     * Returns an unsubscribe function.
     */
    onPresenceChange(callback: (onlineUserIds: string[]) => void): () => void {
        this.listeners.push(callback);
        // Immediately call with current state
        callback(Array.from(this.onlineUsers));
        return () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
        };
    }

    private notifyListeners(): void {
        const userIds = Array.from(this.onlineUsers);
        this.listeners.forEach((listener) => listener(userIds));
    }
}

export const presenceService = new PresenceService();
