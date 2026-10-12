/*
# Enable realtime for user_profiles and messages tables

## Purpose
Supabase realtime publication is currently empty — no table changes are pushed to the frontend.
This means the AuthContext's realtime subscription on user_profiles never fires, so when an admin
grants can_publish to a user, the user's UI doesn't update until they log out and back in.

## Changes
1. Add `user_profiles` to the supabase_realtime publication so profile changes (role, can_publish, is_blocked) push to clients live.
2. Add `messages` to the supabase_realtime publication so new chat messages appear in real-time.

## Security
- No RLS changes. Realtime respects RLS — clients only receive events for rows they can SELECT.
- No data is exposed that wasn't already accessible via SELECT policies.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;