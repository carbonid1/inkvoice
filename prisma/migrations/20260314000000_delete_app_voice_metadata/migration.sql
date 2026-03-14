-- App voice metadata is now defined in code (APP_VOICES const).
-- Only custom voice metadata belongs in the database.
DELETE FROM "VoiceMetadata" WHERE "type" = 'app';
