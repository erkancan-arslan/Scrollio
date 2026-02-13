DO $$ BEGIN
    ALTER TABLE duel_matches ADD COLUMN IF NOT EXISTS ready_a BOOLEAN DEFAULT false;
    ALTER TABLE duel_matches ADD COLUMN IF NOT EXISTS ready_b BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
