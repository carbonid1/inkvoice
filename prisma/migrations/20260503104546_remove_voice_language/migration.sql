-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Remove language from VoiceMetadata
CREATE TABLE "new_VoiceMetadata" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "deletedAt" INTEGER
);
INSERT INTO "new_VoiceMetadata" ("name", "displayName", "type", "tags", "deletedAt") SELECT "name", "displayName", "type", "tags", "deletedAt" FROM "VoiceMetadata";
DROP TABLE "VoiceMetadata";
ALTER TABLE "new_VoiceMetadata" RENAME TO "VoiceMetadata";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
