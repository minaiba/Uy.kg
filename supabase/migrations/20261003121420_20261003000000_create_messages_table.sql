/*
# Create messages table for user-to-user chat

## Purpose
Enables a real messaging system between users (buyers/renters) and property owners.
Replaces the one-way "inquiry" system with two-way conversations tied to a property.

## New Tables
- `messages`
  - `id` (uuid, primary key)
  - `property_id` (uuid, FK to properties, identifies which property the conversation is about)
  - `sender_id` (uuid, NOT NULL DEFAULT auth.uid(), FK to auth.users)
  - `receiver_id` (uuid, NOT NULL, FK to auth.users — the property owner)
  - `body` (text, the message content)
  - `read_at` (timestamptz, nullable — set when receiver reads the message)
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `messages`.
- SELECT: authenticated users can see messages they sent OR received.
- INSERT: authenticated users can insert messages where they are the sender (sender_id defaults to auth.uid()).
- UPDATE: authenticated users can mark messages they received as read (set read_at).
- DELETE: authenticated users can delete their own sent messages.

## Existing Data
- No existing tables modified or dropped. All data preserved.
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- SELECT: user can see messages they sent or received
DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- INSERT: user can only send messages as themselves
DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- UPDATE: receiver can mark messages as read
DROP POLICY IF EXISTS "update_received_messages" ON messages;
CREATE POLICY "update_received_messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- DELETE: user can delete their own sent messages
DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);