/*
# Remove admin blanket read access to messages

## Purpose
Admin should only see messages where they are a sender or receiver — same as regular users.
The previous policy allowed admins to read ALL user conversations, which was incorrect.

## Security
- Drops the "select_admin_messages" policy
- Existing "select_own_messages" policy (sender OR receiver) remains and covers admins too
*/

DROP POLICY IF EXISTS "select_admin_messages" ON messages;