-- Create game_scores table
create table public.game_scores (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    game_id text not null,
    score integer not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone not null default now(),
    constraint game_scores_pkey primary key (id)
);

-- Enable RLS
alter table public.game_scores enable row level security;

-- Policies
create policy "Users can insert their own scores"
    on public.game_scores for insert
    with check (auth.uid() = user_id);

create policy "Public can view all scores"
    on public.game_scores for select
    using (true);

-- Indexes for performance (filtering by game and sorting by score/time)
create index idx_game_scores_game_id on public.game_scores(game_id);
create index idx_game_scores_created_at on public.game_scores(created_at desc);
create index idx_game_scores_score on public.game_scores(score desc);
create index idx_game_scores_leaderboard on public.game_scores(game_id, score desc, created_at asc);
