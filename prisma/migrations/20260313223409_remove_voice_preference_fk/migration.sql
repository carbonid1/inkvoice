-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VoicePreference" (
    "bookId" TEXT NOT NULL PRIMARY KEY,
    "voiceName" TEXT NOT NULL
);
INSERT INTO "new_VoicePreference" ("bookId", "voiceName") SELECT "bookId", "voiceName" FROM "VoicePreference";
DROP TABLE "VoicePreference";
ALTER TABLE "new_VoicePreference" RENAME TO "VoicePreference";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
