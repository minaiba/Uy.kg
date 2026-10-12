/*
# Allow admins to read all messages

## Purpose
Admins need to see all user conversations in the admin messages panel.
Currently the SELECT policy only allows sender or receiver to read messages.
This adds a separate policy so admin role can read everything.

## Security
- New SELECT policy for admins only (TO authenticated, USING is_admin())
- No INSERT/UPDATE/DELETE changes — admins still can't write/delete messages
- Existing user policies remain unchanged
*/

DROP POLICY IF EXISTS "select_admin_messages" ON messages;
CREATE POLICY "select_admin_messages"
ON messages FOR SELECT
TO authenticated
USING (is_admin());