-- Parent PIN system for Kids parental dashboard

CREATE TABLE IF NOT EXISTS public.parent_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_pins_user_id ON public.parent_pins(user_id);

ALTER TABLE public.parent_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pin"
    ON public.parent_pins FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
