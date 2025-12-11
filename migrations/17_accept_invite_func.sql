-- 17_accept_invite_func.sql

CREATE OR REPLACE FUNCTION accept_invitation(invite_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (bypass RLS for insertion)
SET search_path = public -- Security best practice
AS $$
DECLARE
    invite_record RECORD;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- 1. Find Invite
    SELECT * INTO invite_record
    FROM club_invitations
    WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

    IF invite_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invitación inválida o expirada.');
    END IF;

    -- 2. Check if already member
    IF EXISTS (SELECT 1 FROM club_members WHERE club_id = invite_record.club_id AND profile_id = user_id) THEN
        -- Already member, just mark invite used
        UPDATE club_invitations SET status = 'accepted' WHERE id = invite_record.id;
        RETURN jsonb_build_object('success', true, 'message', 'Ya eres miembro del club.');
    END IF;

    -- 3. Insert Member
    INSERT INTO club_members (club_id, profile_id, role)
    VALUES (invite_record.club_id, user_id, invite_record.role);

    -- 4. Mark Invite Accepted
    UPDATE club_invitations SET status = 'accepted' WHERE id = invite_record.id;

    RETURN jsonb_build_object('success', true, 'club_id', invite_record.club_id);
END;
$$;
