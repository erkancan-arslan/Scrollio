
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from backend root
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestMatch() {
    const { data: matches, error } = await supabase
        .from('duel_matches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching match:', error);
        return;
    }

    if (!matches || matches.length === 0) {
        console.log('No matches found.');
        return;
    }

    const match = matches[0];
    console.log('=== LATEST MATCH ===');
    console.log(`ID: ${match.id}`);
    console.log(`State: ${match.state}`);
    console.log(`Created At: ${match.created_at}`);
    console.log(`Last Tick At: ${match.last_tick_at}`);
    console.log(`Finish Reason: ${match.finish_reason}`);
    console.log(`Remaining A: ${match.remaining_ms_a}`);
    console.log(`Remaining B: ${match.remaining_ms_b}`);
    console.log(`Player A Answered: ${match.player_a_answered}`);
    console.log(`Player B Answered: ${match.player_b_answered}`);
    console.log(`Current Question: ${match.current_question_index}`);
    console.log('====================');

    // Check events
    const { data: events } = await supabase
        .from('duel_events')
        .select('*')
        .eq('match_id', match.id)
        .order('seq', { ascending: true });

    console.log(`Events: ${events?.length || 0}`);
    events?.forEach(e => {
        console.log(`- [${e.type}] ${JSON.stringify(e.payload)}`);
    });
}

checkLatestMatch();
