/*
# Add telegram_chat_id to properties for bot-created listings
- Allows /myads to find properties created via the Telegram bot.
- Allows /sell and /lease to create draft listings linked to the bot user.
*/

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;
