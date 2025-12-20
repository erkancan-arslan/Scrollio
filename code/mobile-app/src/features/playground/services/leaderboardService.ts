import { getAuthenticatedSupabase } from '../../../services/supabase/client';

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    score: number;
    display_name: string;
    avatar_url: string;
    created_at: string;
}

export const leaderboardService = {
    /**
     * Submit a score for a game
     * Inserts into game_sessions, which triggers update to game_scores
     */
    async submitScore(gameType: string, score: number, metadata: object = {}) {
        const supabase = await getAuthenticatedSupabase();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('Cannot submit score: User not authenticated');
            return null;
        }

        const { data, error } = await supabase
            .from('game_sessions')
            .insert({
                user_id: user.id,
                game_type: gameType,
                score,
                metadata,
                started_at: new Date().toISOString(),
                is_verified: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error submitting score:', error);
            throw error;
        }

        return data;
    },

    /**
     * Fetch leaderboard from pre-aggregated game_scores table.
     * This effectively shows All-Time Best Scores.
     */
    async fetchWeeklyLeaderboard(gameType: string): Promise<LeaderboardEntry[]> {
        const supabase = await getAuthenticatedSupabase();

        // Query the game_scores table which holds the BEST SCORE per user
        const { data: scores, error } = await supabase
            .from('game_scores')
            .select('user_id, best_score, last_played_at')
            .eq('game_type', gameType)
            .order('best_score', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Leaderboard fetch error:', error);
            return [];
        }

        if (!scores || scores.length === 0) return [];

        // Get unique user IDs to fetch profiles
        const userIds = [...new Set(scores.map(s => s.user_id))];

        // Fetch profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return [];
        }

        // Map profiles to scores
        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        const leaderboard: LeaderboardEntry[] = scores.map((s, index) => ({
            rank: index + 1,
            user_id: s.user_id,
            score: s.best_score, // Map best_score to score for the UI
            created_at: s.last_played_at,
            display_name: profileMap.get(s.user_id)?.display_name || 'Anonymous',
            avatar_url: profileMap.get(s.user_id)?.avatar_url || '',
        }));

        return leaderboard;
    }
};
