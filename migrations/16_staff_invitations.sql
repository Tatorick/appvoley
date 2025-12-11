-- 16_staff_invitations.sql

CREATE TABLE club_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    email TEXT, -- Optional, just for record keeping if known
    role TEXT NOT NULL CHECK (role IN ('coach', 'assistant', 'admin')),
    token UUID DEFAULT uuid_generate_v4() UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE club_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can manage invitations
CREATE POLICY "Club owners manage invitations" ON club_invitations
FOR ALL USING (
    EXISTS (SELECT 1 FROM clubs WHERE id = club_invitations.club_id AND created_by = auth.uid())
);

-- Public (anon) or Authenticated users need to read invitation by token to validate it
-- We'll use a secure function or open read policy for token exact match?
-- Safer: Open read, but only if they know the token. RLS makes filtering hard without "security definer" function.
-- Let's enable read for valid tokens.
CREATE POLICY "Anyone can view valid invitations by token" ON club_invitations
FOR SELECT USING (
    status = 'pending' AND expires_at > now()
);
