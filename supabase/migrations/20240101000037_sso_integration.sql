-- Step 1: Create the sso_tokens table
CREATE TABLE IF NOT EXISTS sso_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket TEXT UNIQUE NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('child', 'parent', 'admin')),
    actor_id UUID NOT NULL,
    parent_id UUID,
    plan TEXT DEFAULT 'free',
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sso_tokens_ticket ON sso_tokens(ticket);

-- Helper Function to generate a ticket (Step 2 logic)
-- This allows you to generate a ticket easily via SQL if needed
CREATE OR REPLACE FUNCTION generate_sso_ticket(
    p_actor_type TEXT,
    p_actor_id UUID,
    p_parent_id UUID DEFAULT NULL,
    p_plan TEXT DEFAULT 'free'
) RETURNS TEXT AS $$
DECLARE
    v_ticket TEXT;
BEGIN
    v_ticket := 'sso_tk_' || replace(gen_random_uuid()::text, '-', '');
    
    INSERT INTO sso_tokens (ticket, actor_type, actor_id, parent_id, plan, expires_at)
    VALUES (
        v_ticket,
        p_actor_type,
        p_actor_id,
        p_parent_id,
        p_plan,
        NOW() + INTERVAL '30 seconds'
    );
    
    RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
